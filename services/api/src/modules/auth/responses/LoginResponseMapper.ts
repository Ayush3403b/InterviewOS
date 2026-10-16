import { UserDocument } from "../../users/models/UserModel";

import { LoginResponse } from "./LoginResponse";

export class LoginResponseMapper {
  static toResponse(
    user: UserDocument,
    accessToken: string,
    refreshToken: string
  ): LoginResponse {
    return {
      accessToken,

      refreshToken,

      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }
}