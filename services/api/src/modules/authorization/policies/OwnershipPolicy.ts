import { UserRole } from "../../users/types/user.types";

export class OwnershipPolicy {

  /**
   * Super Admin owns everything.
   */
  public static isSuperAdmin(
    role: UserRole
  ): boolean {

    return role === UserRole.SUPER_ADMIN;
  }

  /**
   * Resource owner check.
   */
  public static isOwner(
    currentUserId: string,
    resourceOwnerId: string
  ): boolean {

    return currentUserId === resourceOwnerId;
  }

  /**
   * Owner OR Super Admin.
   */
  public static canAccessOwnResource(
    currentUserId: string,
    resourceOwnerId: string,
    role: UserRole
  ): boolean {

    return (
      this.isSuperAdmin(role) ||
      this.isOwner(
        currentUserId,
        resourceOwnerId
      )
    );
  }

}