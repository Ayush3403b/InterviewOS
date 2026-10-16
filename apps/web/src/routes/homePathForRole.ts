import type { UserRole } from "../features/auth/types";

/**
 * Single switch point for where each role lands after auth. Right
 * now every role lands on the same placeholder shell - as
 * role-specific dashboards get built (student/org/recruiter), point
 * a role's entry at the real route here and nothing else has to
 * change.
 */
const ROLE_HOME_PATHS: Record<UserRole, string> = {
  student: "/app",
  recruiter: "/app",
  faculty: "/app",
  admin: "/app",
  super_admin: "/app",
};

export function homePathForRole(role: UserRole): string {
  return ROLE_HOME_PATHS[role] ?? "/app";
}
