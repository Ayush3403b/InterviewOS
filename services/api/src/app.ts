import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import routes from "./routes";

import { errorMiddleware } from "./middlewares/error.middleware";
import { notFoundMiddleware } from "./middlewares/notFound.middleware";
import { requestIdMiddleware } from "./middlewares/requestId.middleware";
import { requestLoggerMiddleware } from "./middlewares/requestLogger.middleware";
import { apiRateLimiter } from "./middlewares/rateLimit.middleware";


const app = express();

app.use(requestIdMiddleware);

app.use(requestLoggerMiddleware);

app.use(cors());

app.use(helmet());

app.use(compression());

app.use(cookieParser());

app.use(morgan("dev"));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// Baseline abuse/DoS guard - the auth and proctoring-signal routes
// layer stricter, purpose-specific limiters on top of this (see
// AuthRoutes.ts and ProctoringRoutes.ts).
app.use("/api/v1", apiRateLimiter, routes);

app.get("/", (_, res) => {
  res.json({
    success: true,
    message: "Welcome to InterviewOS API",
    version: "v1",
    docs: "/api/v1/health",
  });
});

/**
 * 404
 */

app.use(notFoundMiddleware);

/**
 * Global Error
 */

app.use(errorMiddleware);

export default app;