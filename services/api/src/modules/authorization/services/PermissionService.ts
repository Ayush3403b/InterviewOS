import { UserRole } from "../../users/types/user.types";
import { Permission } from "../constants/Permissions";
import { RolePermissions } from "../constants/RolePermissions";

export class PermissionService {

  /**
   * Check whether a role has a specific permission.
   */
  public hasPermission(
    role: UserRole,
    permission: Permission
  ): boolean {

    const permissions =
      RolePermissions[role] ?? [];

    return permissions.includes(permission);
  }

  /**
   * Check whether a role has ALL permissions.
   */
  public hasAllPermissions(
    role: UserRole,
    permissions: Permission[]
  ): boolean {

    const assigned =
      RolePermissions[role] ?? [];

    return permissions.every(
      permission => assigned.includes(permission)
    );
  }

  /**
   * Check whether a role has ANY permission.
   */
  public hasAnyPermission(
    role: UserRole,
    permissions: Permission[]
  ): boolean {

    const assigned =
      RolePermissions[role] ?? [];

    return permissions.some(
      permission => assigned.includes(permission)
    );
  }

}
