import http from "http";

import app from "./app";

import { env } from "./config/env";
import { connectDatabase } from "./config/database";

import { logger } from "./shared/logger/logger";

import { createSocketServer } from "./config/socket";
import { registerSocketGateways } from "./socket/gateway";

async function bootstrap() {
  try {
    // Connect Database
    await connectDatabase();

    // Create HTTP Server
    const server = http.createServer(app);

    // Real-time (continuous proctoring, etc.)
    const io = createSocketServer(server);
    registerSocketGateways(io);

    // Start Server
    server.listen(env.PORT, () => {
      logger.success(
        `🚀 InterviewOS API is running on http://localhost:${env.PORT}`
      );

      logger.info(`Environment: ${env.NODE_ENV}`);
      logger.info(
        `AI Evaluation Provider: ${env.AI_EVALUATION_PROVIDER} (${env.GEMINI_MODEL})`
      );
    });

    /**
     * Graceful Shutdown
     */

    process.on("SIGINT", () => {
      logger.warn("Server shutting down...");

      server.close(() => {
        logger.success("Server closed successfully.");

        process.exit(0);
      });
    });

    process.on("SIGTERM", () => {
      logger.warn("Termination signal received.");

      server.close(() => {
        logger.success("Server terminated.");

        process.exit(0);
      });
    });
  } catch (error) {
    logger.error("Application failed to start.", error);

    process.exit(1);
  }
}

bootstrap();