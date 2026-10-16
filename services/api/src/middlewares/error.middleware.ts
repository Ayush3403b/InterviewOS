import { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";

import { ApiError } from "../shared/errors/ApiError";
import { ErrorCode } from "../shared/errors/ErrorCode";
import { ErrorTelemetry } from "../shared/telemetry/ErrorTelemetry";

export function errorMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const requestId = req.headers["x-request-id"] as string | undefined;
  const userId = (req as any).user?.sub;

  // Upload limits (file too big, too many files) are the client's
  // problem, not a server fault - answer 413/400 instead of a 500.
  if (error instanceof MulterError) {
    const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;

    return res.status(status).json({
      success: false,
      message:
        error.code === "LIMIT_FILE_SIZE"
          ? "That file is too large."
          : error.code === "LIMIT_FILE_COUNT"
            ? "Too many files in one upload."
            : error.message,
      error: {
        code: ErrorCode.BAD_REQUEST,
        status,
        requestId,
      },
    });
  }

  if (error instanceof ApiError) {
    if (error.statusCode >= 500) {
      ErrorTelemetry.record({
        error,
        statusCode: error.statusCode,
        errorCode: error.code,
        requestId,
        route: req.originalUrl || req.path,
        method: req.method,
        userId,
        clientIp: req.ip,
      });
    }

    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      error: {
        code: error.code,
        status: error.statusCode,
        requestId,
      },
    });
  }

  const record = ErrorTelemetry.record({
    error,
    statusCode: 500,
    errorCode: "INTERNAL_SERVER_ERROR",
    requestId,
    route: req.originalUrl || req.path,
    method: req.method,
    userId,
    clientIp: req.ip,
  });

  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: {
      code: "INTERNAL_SERVER_ERROR",
      status: 500,
      requestId: requestId || record.id,
    },
  });
}