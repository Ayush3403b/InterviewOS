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
}

export default AuthController;