import { Permission } from "./Permissions";
import { UserRole } from "../../users/types/user.types";

export const RolePermissions: Record<UserRole, Permission[]> = {

  [UserRole.STUDENT]: [
    Permission.PROFILE_READ,
    Permission.PROFILE_UPDATE,
    Permission.INTERVIEW_CREATE,
    Permission.INTERVIEW_READ,
  ],

  [UserRole.RECRUITER]: [
    Permission.CANDIDATE_VIEW,
    Permission.INTERVIEW_READ,
  ],

  [UserRole.FACULTY]: [
    Permission.STUDENT_MANAGE,
    Permission.INTERVIEW_READ,
  ],

  [UserRole.ADMIN]: [
    Permission.PROFILE_READ,
    Permission.PROFILE_UPDATE,
    Permission.INTERVIEW_CREATE,
    Permission.INTERVIEW_READ,
    Permission.INTERVIEW_UPDATE,
    Permission.INTERVIEW_DELETE,
    Permission.CANDIDATE_VIEW,
    Permission.STUDENT_MANAGE,
  ],

  [UserRole.SUPER_ADMIN]: Object.values(Permission),
};