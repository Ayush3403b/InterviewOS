import { Server, Socket } from "socket.io";

import { JwtService } from "../shared/security/JwtService";
import { TokenPayload } from "../shared/security/TokenPayload";
import { logger } from "../shared/logger/logger";

import { proctoringService } from "../container";
import { registerVoiceGateway } from "./voiceGateway";

import { UserRole } from "../modules/users/types/user.types";
import { RecordSignalDto } from "../modules/proctoring/dtos/RecordSignalDto";
import { RecordSignalSchema } from "../modules/proctoring/validations/RecordSignal.validation";
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

function watchRoom(interviewSessionId: string): string {
  return `interview:${interviewSessionId}:watchers`;
}

function candidateRoom(interviewSessionId: string): string {
  return `interview:${interviewSessionId}`;
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
 *  1. Candidate client connects, joins `interview:<id>`, and starts
 *     a proctoring session.
 *  2. Every few seconds it emits "proctoring:signal" with derived
 *     client-side detections (face/gaze/tab/objects/audio - never
 *     raw continuous video).
 *  3. The signal is analyzed by whichever IProctoringAgent is wired
 *     up in the container, persisted, and:
 *       - low/medium flags are echoed back to the candidate as a
 *         gentle "proctoring:warning" (e.g. "please stay in frame")
 *       - any flag is broadcast to recruiters/org staff watching
 *         that interview as "proctoring:alert", for live monitoring.
 *  4. Recruiter/org dashboards connect and join the same interview's
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

    socket.on(
      "proctoring:join",
      async (payload: {
        interviewSessionId: string;
        organizationId?: string;
        consentGiven?: boolean;
        consentVersion?: string;
        referenceFrame?: string;
      }) => {
        try {
          const {
            interviewSessionId,
            organizationId,
            consentGiven,
            consentVersion,
            referenceFrame,
          } = payload;

          if (WATCHER_ROLES.includes(user.role)) {
            // Recruiter/org staff observing a live interview.
            socket.join(watchRoom(interviewSessionId));
          } else {
            // Candidate taking the interview - start/resume tracking.
            socket.join(candidateRoom(interviewSessionId));

            await proctoringService.startSession(
              interviewSessionId,
              user.sub,
              organizationId,
              consentGiven,
              consentVersion,
              referenceFrame
            );
          }

          socket.emit("proctoring:joined", { interviewSessionId });
        } catch (error) {
          socket.emit("proctoring:error", {
            message: (error as Error).message,
          });
        }
      }
    );

    socket.on(
      "proctoring:signal",
      async (
        payload: RecordSignalDto & { interviewSessionId: string }
      ) => {
        try {
          if (!signalRateLimiter.consume(user.sub)) {
            socket.emit("proctoring:error", {
              message: "Too many signals sent too quickly. Slowing down.",
            });
            return;
          }

          const { interviewSessionId, ...rawSignal } = payload ?? {};

          if (!interviewSessionId || typeof interviewSessionId !== "string") {
            socket.emit("proctoring:error", {
              message: "interviewSessionId is required.",
            });
            return;
          }

          // Sockets bypass the Express validation middleware, so this
          // is the only place enforcing shape/size limits (e.g. the
          // frameBase64 cap) on this, the primary signal-ingestion
          // path - the REST route in ProctoringRoutes.ts is a fallback.
          const parsed = RecordSignalSchema.safeParse(rawSignal);

          if (!parsed.success) {
            socket.emit("proctoring:error", {
              message: "Invalid proctoring signal payload.",
            });
            return;
          }

          const result = await proctoringService.recordSignal(
            interviewSessionId,
            user.sub,
            parsed.data
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

          namespace.to(watchRoom(interviewSessionId)).emit("proctoring:alert", {
            interviewSessionId,
            flags: result.flags,
            trustScore: result.session.trustScore,
            status: result.session.status,
          });
        } catch (error) {
          socket.emit("proctoring:error", {
            message: (error as Error).message,
          });
        }
      }
    );

    socket.on("proctoring:leave", (payload: { interviewSessionId: string }) => {
      socket.leave(candidateRoom(payload.interviewSessionId));
      socket.leave(watchRoom(payload.interviewSessionId));
    });

    socket.on("disconnect", () => {
      logger.info(`Proctoring socket disconnected: ${socket.id}`);
    });
  });
}
