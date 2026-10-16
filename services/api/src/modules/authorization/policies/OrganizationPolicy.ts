import { Types } from "mongoose";

import { UserRole } from "../../users/types/user.types";

export class OrganizationPolicy {

  /**
   * Super Admin bypasses organization boundaries.
   */
  public static isSuperAdmin(
    role: UserRole
  ): boolean {

    return role === UserRole.SUPER_ADMIN;
  }

  /**
   * Check whether two users belong
   * to the same organization.
   */
  public static belongsToSameOrganization(
    currentOrganizationId?: Types.ObjectId,
    targetOrganizationId?: Types.ObjectId
  ): boolean {
    if (
      !currentOrganizationId ||
      !targetOrganizationId
    ) {
      return false;
    }
    return (
      currentOrganizationId.toString() ===
      targetOrganizationId.toString()
    );
  }

  /**
   * Organization OR Super Admin.
   */
  public static canAccessOrganization(
    role: UserRole,
    currentOrganizationId?: Types.ObjectId,
    targetOrganizationId?: Types.ObjectId
  ): boolean {
    return (
      this.isSuperAdmin(role) ||
      this.belongsToSameOrganization(
        currentOrganizationId,
        targetOrganizationId
      )
    );
  }
}