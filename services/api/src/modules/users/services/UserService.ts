import { BaseService } from "../../../shared/services/BaseService";

import { UserRepository } from "../repositories/UserRepository";

import { CreateUserDto } from "../dtos/CreateUser.dto";

import { UpdateProfileDto } from "../dtos/UpdateProfile.dto";

import { ProfilePolicy } from "../domain/ProfilePolicy";

import { ProfileCompletion } from "../domain/ProfileCompletion";

import { PasswordService } from "../../../shared/security/PasswordService";

import { ChangePasswordDto } from "../dtos/ChangePassword.dto";

import { PasswordPolicy } from "../domain/PasswordPolicy";

import { ApiError } from "../../../shared/errors/ApiError";

import { ErrorCode } from "../../../shared/errors/ErrorCode";

export class UserService extends BaseService<UserRepository> {
  constructor(repository: UserRepository) {
    super(repository);
  }

  public async getUserByEmail(email: string) {
    return this.repository.findByEmail(email);
  }

  public async userExists(email: string) {
    return this.repository.exists(email);
  }

  public async createUser(user: CreateUserDto) {
    return this.repository.createUser(user);
  }

  public async updateLastLogin(userId: string) {
    return this.repository.updateLastLogin(userId);
  }

  public async getUserById(id: string) {
    return this.repository.findById(id);
  }

  public async updateProfile(
    userId: string,
    data: UpdateProfileDto
  ) {

    const editable =
      ProfilePolicy.filterEditableFields(data);

    const updatedUser =
      await this.repository.updateProfile(
        userId,
        editable
      );

    if (!updatedUser) {
      return null;
    }

    const profileCompleted =
      ProfileCompletion.isComplete(updatedUser);

    if (
      updatedUser.profileCompleted !==
      profileCompleted
    ) {

      updatedUser.profileCompleted =
        profileCompleted;

      await updatedUser.save();
    }

    return updatedUser;
  }

  public async changePassword(
    userId: string,
    data: ChangePasswordDto
  ) {

    const user =
      await this.repository.findByIdWithPassword(
        userId
      );

    if (!user) {
      throw new ApiError(
        404,
        "User not found",
        ErrorCode.NOT_FOUND
      );
    }

    const matches =
      await PasswordService.compare(
        data.currentPassword,
        user.password
      );

    if (!matches) {
      throw new ApiError(
        400,
        "Current password is incorrect",
        ErrorCode.BAD_REQUEST
      );
    }

    if (
      !PasswordPolicy.validate(
        data.newPassword
      )
    ) {
      throw new ApiError(
        400,
        "Password does not meet security requirements",
        ErrorCode.BAD_REQUEST
      );
    }

    const hashedPassword =
      await PasswordService.hash(
        data.newPassword
      );

    await this.repository.updatePassword(
      userId,
      hashedPassword
    );
  }

  public async savePasswordResetToken(
    userId: string,
    token: string,
    expiresAt: Date
  ) {
    return this.repository.updatePasswordResetToken(
      userId,
      token,
      expiresAt
    );
  }

  public async getUserByPasswordResetToken(
    token: string
  ) {
    return this.repository.findByPasswordResetToken(
      token
    );
  }

  public async clearPasswordResetToken(
    userId: string
  ) {
    return this.repository.clearPasswordResetToken(
      userId
    );
  }

  public async resetPassword(
    userId: string,
    hashedPassword: string
  ) {
    return this.repository.resetPassword(
      userId,
      hashedPassword
    );
  }

  public async saveEmailVerificationToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date
  ) {
    return this.repository.saveEmailVerificationToken(
      userId,
      tokenHash,
      expiresAt
    );
  }

  public async getUserByEmailVerificationToken(
    tokenHash: string
  ) {
    return this.repository.getUserByEmailVerificationToken(
      tokenHash
    );
  }

  public async markEmailVerified(
    userId: string
  ) {
    return this.repository.markEmailVerified(
      userId
    );
  }

  public async clearEmailVerificationToken(
    userId: string
  ) {
    return this.repository.clearEmailVerificationToken(
      userId
    );
  }
}