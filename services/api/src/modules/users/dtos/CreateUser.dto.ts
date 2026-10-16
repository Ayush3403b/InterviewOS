import { Types } from "mongoose";
import { UserRole, UserStatus } from "../types/user.types";

export interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;

  avatar?: string;

  role?: UserRole;
  status?: UserStatus;

  organizationId?: Types.ObjectId;

  isEmailVerified?: boolean;
  profileCompleted?: boolean;
  emailVerifiedAt?: Date;
  lastLoginAt?: Date;
}