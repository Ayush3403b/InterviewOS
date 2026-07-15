import { BaseService } from "../../../shared/services/BaseService";

import { UserRepository } from "../repositories/UserRepository";

import { CreateUserDto } from "../dtos/CreateUser.dto";

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
}