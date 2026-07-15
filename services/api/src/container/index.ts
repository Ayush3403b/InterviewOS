import { UserRepository } from "../modules/users/repositories/UserRepository";
import { UserService } from "../modules/users/services/UserService";
import UserController from "../modules/users/controllers/UserController";

import { AuthService } from "../modules/auth/services/AuthService";
import AuthController from "../modules/auth/controllers/AuthController";
import { NodemailerService } from "../shared/mail";

/**
 * Repositories
 */
const userRepository = new UserRepository();

/**
 * Services
 */
const userService = new UserService(userRepository);

const emailService = new NodemailerService();

const authService =
    new AuthService(
        userService,
        emailService
    );

/**
 * Controllers
 */
const userController = new UserController(userService);

const authController = new AuthController(authService);

export {
  userRepository,

  userService,

  authService,

  userController,

  authController,

  emailService,
};