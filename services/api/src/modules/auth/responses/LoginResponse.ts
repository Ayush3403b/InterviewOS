import { UserRole } from "../../users/types/user.types";

export interface LoginResponse {
  accessToken: string;

  user: {
    id: string;

    firstName: string;

    lastName: string;

    email: string;

    role: UserRole;

    isEmailVerified: boolean;
  };

  refreshToken: string;
}