import { Request, Response } from "express";

import { BaseController } from "../../../shared/http/BaseController";

import { AuthService } from "../services/AuthService";
import AuditLogService from "../../audit-log/services/AuditLogService";
import { AuditAction } from "../../audit-log/types/audit-log.types";

import { AuthenticatedRequest } from "../../../shared/security/AuthenticatedRequest";

import { ApiError } from "../../../shared/errors/ApiError";

import { ErrorCode } from "../../../shared/errors/ErrorCode";

class AuthController extends BaseController {
  constructor(
    private readonly authService: AuthService,
    private readonly auditLogService: AuditLogService
  ) {
    super();
  }

  private requestContext(req: Request) {
    return {
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    };
  }

  public register = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const result = await this.authService.register(req.body);

    await this.auditLogService.record({
      action: AuditAction.REGISTER,
      actorId: result.id,
      metadata: { email: result.email },
      ...this.requestContext(req),
    });

    return this.created(
      res,
      "Registration successful",
      result
    );
  };

  public sendVerificationEmail = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<Response> => {

    const userId = req.user?.sub;

    if (!userId) {
      throw new ApiError(
        401,
        "Unauthorized",
        ErrorCode.UNAUTHORIZED
      );
    }

    await this.authService.sendVerificationEmail(
      userId
    );

    return this.ok(
      res,
      "Verification email sent successfully"
    );
  };

  public login = async (
    req: Request,
    res: Response
  ): Promise<Response> => {

    const context = this.requestContext(req);

    let result;
    try {
      result = await this.authService.login(req.body, context);
    } catch (error) {
      await this.auditLogService.record({
        action: AuditAction.LOGIN_FAILED,
        metadata: { email: (req.body as { email?: string })?.email },
        ...context,
      });
      throw error;
    }

    await this.auditLogService.record({
      action: AuditAction.LOGIN_SUCCESS,
      actorId: result.user.id,
      ...context,
    });

    return this.ok(
      res,
      "Login successful",
      result
    );
  };

  public forgotPassword = async (
    req: Request,
    res: Response
  ): Promise<Response> => {

    await this.authService.forgotPassword(req.body);

    await this.auditLogService.record({
      action: AuditAction.PASSWORD_RESET_REQUESTED,
      metadata: { email: (req.body as { email?: string })?.email },
      ...this.requestContext(req),
    });

    return this.ok(
      res,
      "If an account exists, a password reset email has been sent."
    );
  };

  public verifyEmail = async (
    req: Request,
    res: Response
  ): Promise<Response> => {

    await this.authService.verifyEmail(
      req.body
    );

    return this.ok(
      res,
      "Email verified successfully"
    );

  };

  public resendVerificationEmail = async (
    req: Request,
    res: Response
  ): Promise<Response> => {

    await this.authService.resendVerificationEmail(
      req.body
    );

    return this.ok(
      res,
      "If the account exists, a verification email has been sent."
    );

  };

  public resetPassword = async (
    req: Request,
    res: Response
  ): Promise<Response> => {

    await this.authService.resetPassword(
      req.body
    );

    await this.auditLogService.record({
      action: AuditAction.PASSWORD_RESET_COMPLETED,
      ...this.requestContext(req),
    });

    return this.ok(
      res,
      "Password reset successfully"
    );
  };

  public refreshToken = async (
    req: Request,
    res: Response
  ): Promise<Response> => {

    const result =
      await this.authService.refreshToken(
        req.body
      );

    return this.ok(
      res,
      "Token refreshed successfully",
      result
    );
  };

  public logout = async (
    req: Request,
    res: Response
  ): Promise<Response> => {

    await this.authService.logout(req.body);

    await this.auditLogService.record({
      action: AuditAction.LOGOUT,
      ...this.requestContext(req),
    });

    return this.ok(
      res,
      "Logged out successfully"
    );
  };

  public logoutAll = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<Response> => {

    const userId = req.user?.sub;

    if (!userId) {
      throw new ApiError(
        401,
        "Unauthorized",
        ErrorCode.UNAUTHORIZED
      );
    }

    await this.authService.logoutAll(userId);

    await this.auditLogService.record({
      action: AuditAction.LOGOUT_ALL,
      actorId: userId,
      ...this.requestContext(req),
    });

    return this.ok(
      res,
      "Logged out from all devices successfully"
    );
  };

  public getSessions = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<Response> => {

    const userId = req.user?.sub;

    if (!userId) {
      throw new ApiError(
        401,
        "Unauthorized",
        ErrorCode.UNAUTHORIZED
      );
    }

    const result =
      await this.authService.getSessions(
        userId
      );

    return this.ok(
      res,
      "Sessions fetched successfully",
      result
    );
  };
}

export default AuthController;