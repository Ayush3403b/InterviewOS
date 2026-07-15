import { UserDocument } from "../../users/models/UserModel";

import { LoginResponse } from "./LoginResponse";

export class LoginResponseMapper {
  static toResponse(
    user: UserDocument,
    accessToken: string
  ): LoginResponse {
    return {
      accessToken,

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