import { Request, Response, NextFunction } from "express";

import { Permission } from "../constants/Permissions";
import { permissionService } from "../../../container";

import { AuthenticatedRequest } from "../../../shared/security/AuthenticatedRequest";

import { ApiError } from "../../../shared/errors/ApiError";
import { ErrorCode } from "../../../shared/errors/ErrorCode";

export const authorize =
  (...permissions: Permission[]) =>
  (
    req: Request,
    _res: Response,
    next: NextFunction
  ) => {

    const request =
      req as AuthenticatedRequest;

    const user = request.user;

    if (!user) {
      return next(
        new ApiError(
          401,
          "Unauthorized",
          ErrorCode.UNAUTHORIZED
        )
      );
    }

    const allowed =
      permissionService.hasAnyPermission(
        user.role,
        permissions
      );

    if (!allowed) {
      return next(
        new ApiError(
          403,
          "Forbidden",
          ErrorCode.FORBIDDEN
        )
      );
    }

    next();
  };