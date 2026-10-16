import { UserRole } from "../../users/types/user.types";

export interface RegisterResponse {
  id: string;

  firstName: string;

  lastName: string;

  email: string;

  role: UserRole;

  isEmailVerified: boolean;
}