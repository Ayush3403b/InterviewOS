import { Request, Response } from "express";

import { BaseController } from "../../../shared/http/BaseController";

import { AuthService } from "../services/AuthService";

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

  public login = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const result = await this.authService.login(req.body);

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
}

export default AuthController;