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
}