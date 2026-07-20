import { Permission } from "./Permissions";
import { UserRole } from "../../users/types/user.types";

export const RolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.STUDENT]: [
    Permission.PROFILE_READ,
    Permission.PROFILE_UPDATE,

    Permission.INTERVIEW_CREATE,
    Permission.INTERVIEW_READ,

    Permission.QUESTION_READ,
  ],

  [UserRole.RECRUITER]: [
    Permission.PROFILE_READ,
    Permission.PROFILE_UPDATE,

    Permission.CANDIDATE_VIEW,

    Permission.INTERVIEW_CREATE,
    Permission.INTERVIEW_READ,
    Permission.INTERVIEW_UPDATE,

    Permission.QUESTION_READ,
  ],

  [UserRole.FACULTY]: [
    Permission.PROFILE_READ,
    Permission.PROFILE_UPDATE,

    Permission.STUDENT_MANAGE,

    Permission.INTERVIEW_CREATE,
    Permission.INTERVIEW_READ,
    Permission.INTERVIEW_UPDATE,

    Permission.QUESTION_CREATE,
    Permission.QUESTION_READ,
    Permission.QUESTION_UPDATE,
  ],

  [UserRole.ADMIN]: [
    Permission.PROFILE_READ,
    Permission.PROFILE_UPDATE,

    Permission.ORGANIZATION_CREATE,
    Permission.ORGANIZATION_READ,
    Permission.ORGANIZATION_UPDATE,
    Permission.ORGANIZATION_DELETE,
    Permission.ORGANIZATION_RESTORE,

    Permission.INSTITUTE_CREATE,
    Permission.INSTITUTE_READ,
    Permission.INSTITUTE_UPDATE,
    Permission.INSTITUTE_DELETE,

    Permission.STUDENT_CREATE,
    Permission.STUDENT_READ,
    Permission.STUDENT_UPDATE,
    Permission.STUDENT_DELETE,
    Permission.STUDENT_MANAGE,

    Permission.RECRUITER_CREATE,
    Permission.RECRUITER_READ,
    Permission.RECRUITER_UPDATE,
    Permission.RECRUITER_DELETE,

    Permission.INTERVIEW_CREATE,
    Permission.INTERVIEW_READ,
    Permission.INTERVIEW_UPDATE,
    Permission.INTERVIEW_DELETE,

    Permission.QUESTION_CREATE,
    Permission.QUESTION_READ,
    Permission.QUESTION_UPDATE,
    Permission.QUESTION_DELETE,

    Permission.REPORT_READ,
    Permission.REPORT_EXPORT,

    Permission.CANDIDATE_VIEW,

    Permission.USER_MANAGE,
  ],

  [UserRole.SUPER_ADMIN]: Object.values(Permission),
};