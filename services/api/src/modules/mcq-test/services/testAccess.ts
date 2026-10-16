import { ApiError } from "../../../shared/errors/ApiError";
import { ErrorCode } from "../../../shared/errors/ErrorCode";

import { UserRole } from "../../users/types/user.types";

import { McqTestDocument } from "../types/mcq-test.types";

/** Roles that may build tests and review results (route-level gate). */
export const TEST_AUTHOR_ROLES: UserRole[] = [
  UserRole.RECRUITER,
  UserRole.FACULTY,
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
];

/** Admins can manage anyone's test; everyone else only their own. */
const OVERRIDE_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.SUPER_ADMIN];

export interface Requester {
  userId: string;
  role?: UserRole;
}

export function ensureCanManageTest(
  test: McqTestDocument,
  requester: Requester
): void {
  const isOwner = test.createdBy.toString() === requester.userId;
  const isOverride = requester.role
    ? OVERRIDE_ROLES.includes(requester.role)
    : false;

  if (!isOwner && !isOverride) {
    throw new ApiError(
      403,
      "You can only manage tests you created.",
      ErrorCode.FORBIDDEN
    );
  }
}
