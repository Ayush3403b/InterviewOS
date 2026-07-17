import { UserRepository } from "../modules/users/repositories/UserRepository";
import { UserService } from "../modules/users/services/UserService";
import UserController from "../modules/users/controllers/UserController";

import { AuthService } from "../modules/auth/services/AuthService";
import AuthController from "../modules/auth/controllers/AuthController";
import { NodemailerService } from "../shared/mail";
import { RefreshTokenRepository } from "../modules/auth/repositories/RefreshTokenRepository";
import { SessionService } from "../modules/auth/services/SessionService";

import { RefreshTokenService } from "../modules/auth/services/RefreshTokenService";

import { PermissionService } from "../modules/authorization/services/PermissionService";

/**
 * Repositories
 */
const userRepository = new UserRepository();

const refreshTokenRepository =
  new RefreshTokenRepository();

/**
 * Services
 */
const userService =
  new UserService(userRepository);

const emailService =
  new NodemailerService();

const refreshTokenService =
  new RefreshTokenService(
    refreshTokenRepository
  );

const sessionService =
  new SessionService(
    refreshTokenService
  );  

const authService =
  new AuthService(
    userService,
    refreshTokenService,
    emailService
  );  

/**
 * Controllers
 */
const userController =
  new UserController(userService);

const authController =
  new AuthController(authService);

const permissionService =
  new PermissionService();  

export {
  userRepository,

  userService,

  authService,

  userController,

  authController,

  emailService,

  refreshTokenRepository,

  refreshTokenService,

  sessionService,

  permissionService,
};