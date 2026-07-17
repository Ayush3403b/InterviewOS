import { Request, Response } from "express";

import { BaseController } from "../../../shared/http/BaseController";

import { AuthService } from "../services/AuthService";

import { AuthenticatedRequest } from "../../../shared/security/AuthenticatedRequest";

import { ApiError } from "../../../shared/errors/ApiError";

import { ErrorCode } from "../../../shared/errors/ErrorCode";

class AuthController extends BaseController {
  constructor(
    private readonly authService: AuthService
  ) {
    super();
  }

  public register = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const result = await this.authService.register(req.body);

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

  const result = await this.authService.login(
    req.body,
    {
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    }
    );

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