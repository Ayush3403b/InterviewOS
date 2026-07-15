import { NextFunction, Response } from "express";

import { AuthenticatedRequest } from "../shared/security/AuthenticatedRequest";
import { JwtService } from "../shared/security/JwtService";

import { ApiError } from "../shared/errors/ApiError";
import { ErrorCode } from "../shared/errors/ErrorCode";

export function authMiddleware(
  req: AuthenticatedRequest,
  _: Response,
  next: NextFunction
) {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return next(
      new ApiError(
        401,
        "Authentication required",
        ErrorCode.UNAUTHORIZED
      )
    );
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(
      new ApiError(
        401,
        "Invalid authorization header",
        ErrorCode.UNAUTHORIZED
      )
    );
  }

  try {
    const payload =
      JwtService.verifyAccessToken(token);

    req.user = payload;

    next();
 } catch (error) {
  console.error(error);
    return next(
      new ApiError(
        401,
        "Invalid or expired token",
        ErrorCode.UNAUTHORIZED
      )
    );
  }
}