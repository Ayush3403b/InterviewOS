import { NextFunction, Response } from "express";

import { AuthenticatedRequest } from "../shared/security/AuthenticatedRequest";

import { ApiError } from "../shared/errors/ApiError";
import { ErrorCode } from "../shared/errors/ErrorCode";

import { UserRole } from "../modules/users/types/user.types";

export function authorize(
  ...roles: UserRole[]
) {
  return (
    req: AuthenticatedRequest,
    _: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return next(
        new ApiError(
          401,
          "Authentication required",
          ErrorCode.UNAUTHORIZED
        )
      );
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          "Access denied",
          ErrorCode.FORBIDDEN
        )
      );
    }

    next();
  };
}