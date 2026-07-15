import { BaseRepository } from "../../../database/BaseRepository";

import { UserDocument, UserModel } from "../models/UserModel";

import { CreateUserDto } from "../dtos/CreateUser.dto";

export class UserRepository extends BaseRepository<UserDocument> {
  constructor() {
    super(UserModel);
  }

  public async findByEmail(email: string) {
    return this.model.findOne({
      email: email.toLowerCase(),
    });
  }

  public async exists(email: string): Promise<boolean> {
    return !!(await this.findByEmail(email));
  }

  public async createUser(data: CreateUserDto) {
    return this.model.create(data);
  }

  public async findById(id: string) {
    return this.model.findById(id).select("-password");
  }

  public async findByIdWithPassword(
    id: string
  ): Promise<UserDocument | null> {
    return this.model.findById(id);
  }

  public async updateLastLogin(userId: string) {
    return this.model.findByIdAndUpdate(
      userId,
      {
        lastLoginAt: new Date(),
      },
      {
        new: true,
      }
    );
  }

  public async updateProfile(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      avatar?: string;
      organizationId?: string;
      profileCompleted?: boolean;
    }
  ) {
    return this.model.findByIdAndUpdate(
      userId,
      data,
      {
        new: true,
        runValidators: true,
      }
    );
  }

  public async updatePassword(
    userId: string,
    hashedPassword: string
  ): Promise<UserDocument | null> {

    return this.model.findByIdAndUpdate(
      userId,
      {
        password: hashedPassword,
      },
      {
        new: true,
      }
    );
  }

  public async updatePasswordResetToken(
    userId: string,
    token: string,
    expiresAt: Date
  ): Promise<UserDocument | null> {

    return this.model.findByIdAndUpdate(
      userId,
      {
        passwordResetToken: token,
        passwordResetExpiresAt: expiresAt,
      },
      {
        new: true,
      }
    );
  }
}