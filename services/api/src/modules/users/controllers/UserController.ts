import { Request, Response } from "express";

import { BaseController } from "../../../shared/http/BaseController";
import { UserService } from "../services/UserService";

class UserController extends BaseController {
  constructor(private readonly userService: UserService) {
    super();
  }

  public getProfile = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    // Authentication will provide the user ID later.
    // For now, this is a placeholder.

    return this.ok(res, "User module is ready.");
  };
}

export default new UserController(new UserService());