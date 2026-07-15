import { UpdateProfileDto } from "../dtos/UpdateProfile.dto";

export class ProfilePolicy {
  /**
   * Fields that users are allowed to update.
   */
  private static readonly editableFields: (keyof UpdateProfileDto)[] = [
    "firstName",
    "lastName",
    "avatar",
    "organizationId",
  ];

  /**
   * Removes any fields that are not editable.
   */
  static filterEditableFields(
    data: UpdateProfileDto
  ): UpdateProfileDto {

    const filtered: UpdateProfileDto = {};

    for (const field of this.editableFields) {
      if (data[field] !== undefined) {
        filtered[field] = data[field];
      }
    }

    return filtered;
  }
}