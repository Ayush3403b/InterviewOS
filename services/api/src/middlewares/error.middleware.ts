import { NextFunction, Request, Response } from "express";

import { ApiError } from "../shared/errors/ApiError";
import { ErrorTelemetry } from "../shared/telemetry/ErrorTelemetry";

export function errorMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const requestId = req.headers["x-request-id"] as string | undefined;
  const userId = (req as any).user?.sub;

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