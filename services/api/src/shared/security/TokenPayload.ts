import { UserRole } from "../../modules/users/types/user.types";

export interface TokenPayload {
  sub: string;

  role: UserRole;

  iat?: number;

  exp?: number;
}