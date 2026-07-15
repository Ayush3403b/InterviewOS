import { UserDocument } from "../../users/models/UserModel";

import { RegisterResponse } from "./RegisterResponse";

export class RegisterResponseMapper {
  static toResponse(
    user: UserDocument
  ): RegisterResponse {
    return {
      id: user.id,

      firstName: user.firstName,

      lastName: user.lastName,

      email: user.email,

      role: user.role,

      isEmailVerified: user.isEmailVerified,
    };
  }
}