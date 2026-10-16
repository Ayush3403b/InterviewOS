import { UserDocument } from "../models/UserModel";

import { UserResponse } from "./UserResponse";

export class UserResponseMapper {
  static toResponse(
    user: UserDocument
  ): UserResponse {
    return {
      id: user.id,

      firstName: user.firstName,

      lastName: user.lastName,

      email: user.email,

      avatar: user.avatar,

      role: user.role,

      status: user.status,

      isEmailVerified: user.isEmailVerified,

      profileCompleted: user.profileCompleted,

      organizationId: user.organizationId?.toString(),

      createdAt: user.createdAt,

      updatedAt: user.updatedAt,
    };
  }
}