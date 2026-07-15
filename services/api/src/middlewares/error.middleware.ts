import { NextFunction, Request, Response } from "express";

import { ApiError } from "../shared/errors/ApiError";

export function errorMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      error: {
        code: error.code,
        status: error.statusCode,
      },
    });
  }

  console.error(error);

  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: {
      code: "INTERNAL_SERVER_ERROR",
      status: 500,
    },
  });
}