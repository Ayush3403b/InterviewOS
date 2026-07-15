import { UserRole, UserStatus } from "../types/user.types";

export interface UserResponse {
  id: string;

  firstName: string;

  lastName: string;

  email: string;

  avatar?: string;

  role: UserRole;

  status: UserStatus;

  isEmailVerified: boolean;

  profileCompleted: boolean;

  organizationId?: string;

  createdAt: Date;

  updatedAt: Date;
}