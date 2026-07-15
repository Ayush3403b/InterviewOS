import { Response } from "express";

import { BaseController } from "../../../shared/http/BaseController";

import { UserService } from "../services/UserService";

import { AuthenticatedRequest } from "../../../shared/security/AuthenticatedRequest";

import { UserResponseMapper } from "../responses/UserResponseMapper";

import { UpdateProfileDto } from "../dtos/UpdateProfile.dto";

import { ApiError } from "../../../shared/errors/ApiError";

import { ErrorCode } from "../../../shared/errors/ErrorCode";

class UserController extends BaseController {
  constructor(
    private readonly userService: UserService
  ) {
    super();
  }

  public me = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<Response> => {

    const userId = req.user?.sub;

    if (!userId) {
      throw new ApiError(
        401,
        "Authentication required",
        ErrorCode.UNAUTHORIZED
      );
    }

    const user = await this.userService.getUserById(userId);

    if (!user) {
      throw new ApiError(
        404,
        "User not found",
        ErrorCode.NOT_FOUND
      );
    }

    const response =
      UserResponseMapper.toResponse(user);

    return this.ok(
      res,
      "Current user fetched successfully",
      response
    );
  };

  public updateProfile = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<Response> => {

    const userId = req.user?.sub;

    if (!userId) {
      throw new ApiError(
        401,
        "Authentication required",
        ErrorCode.UNAUTHORIZED
      );
    }

    const updatedUser =
      await this.userService.updateProfile(
        userId,
        req.body as UpdateProfileDto
      );

    if (!updatedUser) {
      throw new ApiError(
        404,
        "User not found",
        ErrorCode.NOT_FOUND
      );
    }

    const response =
      UserResponseMapper.toResponse(updatedUser);

    return this.ok(
      res,
      "Profile updated successfully",
      response
    );
  };

  public changePassword = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<Response> => {

    const userId = req.user?.sub;

    if (!userId) {
      throw new ApiError(
        401,
        "Authentication required",
        ErrorCode.UNAUTHORIZED
      );
    }

    await this.userService.changePassword(
      userId,
      req.body
    );

    return this.ok(
      res,
      "Password changed successfully"
    );
  };
}

export default UserController;