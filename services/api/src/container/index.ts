import { UserRepository } from "../modules/users/repositories/UserRepository";
import { UserService } from "../modules/users/services/UserService";

import { AuthService } from "../modules/auth/services/AuthService";

import AuthController from "../modules/auth/controllers/AuthController";

const userRepository = new UserRepository();

const userService = new UserService(userRepository);

const authService = new AuthService(userService);

const authController = new AuthController(authService);

export {
  userRepository,
  userService,
  authService,
  authController,
};