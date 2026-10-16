import { Server, Socket } from "socket.io";
import { logger } from "../shared/logger/logger";
import { JwtService } from "../shared/security/JwtService";
import { TokenPayload } from "../shared/security/TokenPayload";

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

interface AudioChunkPayload {
  interviewSessionId: string;
  chunk: string; // Base64 or array buffer
  mimeType?: string;
  isFinal?: boolean;
}

export function registerVoiceGateway(io: Server): void {
  const namespace = io.of("/voice");

  namespace.use((socket, next) => {
    try {
      const payload = authenticateSocket(socket);
      socket.data.user = payload;
      next();
    } catch {
      // Allow connection with guest/interview session token if present
      if (socket.handshake.auth?.interviewSessionId) {
        socket.data.user = {
          sub: "guest-" + socket.handshake.auth.interviewSessionId,
          role: "CANDIDATE",
          email: "guest@interviewos.dev",
        };
        next();
      } else {
        next(new Error("Unauthorized"));
      }
    }
  });

  namespace.on("connection", (socket: Socket) => {
    logger.info(`[VoiceGateway] Socket connected: ${socket.id} (user: ${socket.data.user?.sub})`);

    socket.on("voice:join", ({ interviewSessionId }: { interviewSessionId: string }) => {
      if (!interviewSessionId) return;
      const room = `voice:interview:${interviewSessionId}`;
      socket.join(room);
      socket.emit("voice:status", { state: "listening", message: "Connected to voice gateway" });
      logger.info(`[VoiceGateway] Socket ${socket.id} joined room ${room}`);
    });

    socket.on("voice:speaking_start", ({ interviewSessionId }: { interviewSessionId: string }) => {
      const room = `voice:interview:${interviewSessionId}`;
      socket.to(room).emit("voice:candidate_speaking", { isSpeaking: true });
    });

    socket.on("voice:speaking_stop", ({ interviewSessionId }: { interviewSessionId: string }) => {
      const room = `voice:interview:${interviewSessionId}`;
      socket.to(room).emit("voice:candidate_speaking", { isSpeaking: false });
    });

    socket.on("voice:audio_chunk", (payload: AudioChunkPayload) => {
      const { interviewSessionId, chunk, isFinal } = payload;
      const room = `voice:interview:${interviewSessionId}`;

      // Simulate real-time streaming speech recognition & incremental transcription
      if (isFinal) {
        socket.emit("voice:status", { state: "processing", message: "Processing voice input..." });

        // Emitting transcription
        const sampleTranscript = "Understood. Let me analyze that and formulate the next technical question.";
        socket.emit("voice:transcript", {
          text: sampleTranscript,
          isFinal: true,
          timestamp: new Date().toISOString(),
        });

        // Simulate AI interviewer speech response stream
        setTimeout(() => {
          socket.emit("voice:status", { state: "speaking", message: "AI Interviewer speaking" });
          
          socket.emit("voice:ai_stream_chunk", {
            text: "Great answer! Can you elaborate on the time complexity and how you would handle race conditions?",
            isFinal: true,
          });

          setTimeout(() => {
            socket.emit("voice:status", { state: "listening", message: "Listening for your reply" });
          }, 1500);
        }, 800);
      } else {
        // Forward chunk to watchers / proctors if needed
        socket.to(room).emit("voice:audio_stream", {
          chunk,
          userId: socket.data.user?.sub,
        });
      }
    });

    socket.on("voice:interrupt", ({ interviewSessionId }: { interviewSessionId: string }) => {
      const room = `voice:interview:${interviewSessionId}`;
      socket.emit("voice:status", { state: "listening", message: "AI interrupted by candidate" });
      socket.to(room).emit("voice:interrupted");
    });

    socket.on("disconnect", () => {
      logger.info(`[VoiceGateway] Socket disconnected: ${socket.id}`);
    });
  });
}
