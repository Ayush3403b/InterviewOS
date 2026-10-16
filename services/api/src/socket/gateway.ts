import { Server, Socket } from "socket.io";

import { JwtService } from "../shared/security/JwtService";
import { TokenPayload } from "../shared/security/TokenPayload";
import { logger } from "../shared/logger/logger";

import { proctoringService } from "../container";
import { registerVoiceGateway } from "./voiceGateway";

import { UserRole } from "../modules/users/types/user.types";
import { SocketSignalSchema } from "../modules/proctoring/validations/RecordSignal.validation";
import { StartProctoringSessionSchema } from "../modules/proctoring/validations/StartProctoringSession.validation";
import { SlidingWindowRateLimiter } from "../shared/security/SlidingWindowRateLimiter";

/**
 * Matches the REST fallback's signalRateLimiter sizing (see
 * rateLimit.middleware.ts) - same policy, different transport.
 */
const signalRateLimiter = new SlidingWindowRateLimiter(
  Number(process.env.SIGNAL_RATE_LIMIT_WINDOW_MS ?? 10 * 1000),
  Number(process.env.SIGNAL_RATE_LIMIT_MAX ?? 20)
);

// Bounds the limiter's own memory over a long-running process -
// stale per-user entries don't accumulate forever.
setInterval(() => signalRateLimiter.sweep(), 60 * 1000).unref();

const WATCHER_ROLES: UserRole[] = [
  UserRole.RECRUITER,
  UserRole.FACULTY,
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
];

/** Rooms are keyed by subjectId alone - ObjectIds don't collide across
 *  interviews and MCQ attempts. */
function watchRoom(subjectId: string): string {
  return `proctoring:${subjectId}:watchers`;
}

function candidateRoom(subjectId: string): string {
  return `proctoring:${subjectId}`;
}

/**
 * Authenticates a socket connection using the same JWT access token
 * issued by the REST auth flow, so no separate auth system is
 * needed for real-time proctoring.
 */
function authenticateSocket(socket: Socket): TokenPayload {
  const bearer = socket.handshake.headers.authorization;

  const token =
    (socket.handshake.auth?.token as string | undefined) ||
    (typeof bearer === "string" ? bearer.split(" ")[1] : undefined);

  if (!token) {
    throw new Error("Authentication required");
  }

  return JwtService.verifyAccessToken(token);
}

/**
 * Registers all real-time gateways on the given Socket.IO server.
 * Each gateway lives on its own namespace so future real-time
 * features (live transcription, chat, etc.) can be added the same
 * way without interfering with proctoring.
 */
export function registerSocketGateways(io: Server): void {
  registerProctoringGateway(io);
  registerVoiceGateway(io);
}

/**
 * Continuous tracking channel.
 *
 * Flow:
 *  1. Candidate client connects, joins `proctoring:<subjectId>` (an
 *     interview session or MCQ attempt), and starts a proctoring
 *     session - ProctoringService confirms they own that subject.
 *  2. Every few seconds it emits "proctoring:signal" with derived
 *     client-side detections (face/gaze/tab/objects/audio - never
 *     raw continuous video).
 *  3. The signal is analyzed by whichever IProctoringAgent is wired
 *     up in the container, persisted, and:
 *       - low/medium flags are echoed back to the candidate as a
 *         gentle "proctoring:warning" (e.g. "please stay in frame")
 *       - any flag is broadcast to recruiters/org staff watching
 *         that subject as "proctoring:alert", for live monitoring.
 *  4. Recruiter/org dashboards connect and join the same subject's
 *     watcher room to receive those alerts live.
 */
function registerProctoringGateway(io: Server): void {
  const namespace = io.of("/proctoring");

  namespace.use((socket, next) => {
    try {
      const payload = authenticateSocket(socket);
      socket.data.user = payload;
      next();
    } catch (error) {
      next(new Error("Unauthorized"));
    }
  });

  namespace.on("connection", (socket: Socket) => {
    const user = socket.data.user as TokenPayload;

    logger.info(`Proctoring socket connected: ${socket.id} (user: ${user.sub})`);

    socket.on("proctoring:join", async (payload: unknown) => {
      try {
        // Sockets bypass the Express validation middleware - same schema
        // as POST /proctoring/sessions (including the referenceFrame cap).
        const parsed = StartProctoringSessionSchema.safeParse(payload);

        if (!parsed.success) {
          socket.emit("proctoring:error", {
            message: "Invalid proctoring join payload.",
          });
          return;
        }

        const {
          subjectType,
          subjectId,
          consentGiven,
          consentVersion,
          referenceFrame,
        } = parsed.data;

        if (WATCHER_ROLES.includes(user.role)) {
          // Recruiter/org staff observing a live session.
          socket.join(watchRoom(subjectId));
        } else {
          // Candidate being proctored - start/resume tracking. Throws
          // (-> proctoring:error) unless they own the subject.
          await proctoringService.startSession(
            subjectType,
            subjectId,
            user.sub,
            consentGiven,
            consentVersion,
            referenceFrame
          );

          socket.join(candidateRoom(subjectId));
        }

        socket.emit("proctoring:joined", { subjectType, subjectId });
      } catch (error) {
        socket.emit("proctoring:error", {
          message: (error as Error).message,
        });
      }
    });

    socket.on("proctoring:signal", async (payload: unknown) => {
      try {
        if (!signalRateLimiter.consume(user.sub)) {
          socket.emit("proctoring:error", {
            message: "Too many signals sent too quickly. Slowing down.",
          });
          return;
        }

        // Sockets bypass the Express validation middleware, so this
        // is the only place enforcing shape/size limits (e.g. the
        // frameBase64 cap) on this, the primary signal-ingestion
        // path - the REST route in ProctoringRoutes.ts is a fallback.
        const parsed = SocketSignalSchema.safeParse(payload);

        if (!parsed.success) {
          socket.emit("proctoring:error", {
            message: "Invalid proctoring signal payload.",
          });
          return;
        }

        const { subjectType, subjectId, ...signal } = parsed.data;

        const result = await proctoringService.recordSignal(
          subjectType,
          subjectId,
          user.sub,
          signal
        );

        if (!result.flags.length) {
          return;
        }

        const gentleFlags = result.flags.filter(
          (flag) => flag.severity === "LOW" || flag.severity === "MEDIUM"
        );

        if (gentleFlags.length) {
          socket.emit("proctoring:warning", {
            flags: gentleFlags,
            trustScore: result.session.trustScore,
          });
        }

        namespace.to(watchRoom(subjectId)).emit("proctoring:alert", {
          subjectType,
          subjectId,
          flags: result.flags,
          trustScore: result.session.trustScore,
          status: result.session.status,
        });
      } catch (error) {
        socket.emit("proctoring:error", {
          message: (error as Error).message,
        });
      }
    });

    socket.on("proctoring:leave", (payload: { subjectId?: string }) => {
      if (typeof payload?.subjectId !== "string") {
        return;
      }
      socket.leave(candidateRoom(payload.subjectId));
      socket.leave(watchRoom(payload.subjectId));
    });

    socket.on("disconnect", () => {
      logger.info(`Proctoring socket disconnected: ${socket.id}`);
    });
  });
}
