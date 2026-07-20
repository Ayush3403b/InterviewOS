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

import OrganizationRepository from "../modules/organization/repositories/OrganizationRepository";

import OrganizationService from "../modules/organization/services/OrganizationService";

import OrganizationController from "../modules/organization/controllers/OrganizationController";

import { InterviewSessionRepository } from "../modules/interview-session/repositories/InterviewSessionRepository";
import InterviewSessionService from "../modules/interview-session/services/InterviewSessionService";
import InterviewSessionController from "../modules/interview-session/controllers/InterviewSessionController";

import ConversationRepository from "../modules/conversation/repositories/ConversationRepository";
import ConversationService from "../modules/conversation/services/ConversationService";
import ConversationController from "../modules/conversation/controllers/ConversationController";



/**
 * Repositories
 */
const userRepository = new UserRepository();

const refreshTokenRepository =
  new RefreshTokenRepository();

const organizationRepository =
  new OrganizationRepository(); 
  
const interviewSessionRepository =
  new InterviewSessionRepository(); 

const conversationRepository =
  new ConversationRepository();  

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

const permissionService =
  new PermissionService();   

const organizationService =
  new OrganizationService(
    organizationRepository
  ); 
  
const interviewSessionService =
  new InterviewSessionService(
    interviewSessionRepository
  ); 
  
const conversationService =
  new ConversationService(
    conversationRepository
  );  

/**
 * Controllers
 */
const userController =
  new UserController(userService);

const authController =
  new AuthController(authService);

const organizationController =
  new OrganizationController(
    organizationService
  );  

const interviewSessionController =
  new InterviewSessionController(
    interviewSessionService
  );
  
const conversationController =
  new ConversationController(
    conversationService
  );  
 

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

  organizationRepository,

  organizationService,

  organizationController,

  interviewSessionRepository,

  interviewSessionService,

  interviewSessionController,

  conversationRepository,

  conversationService,

  conversationController,
};