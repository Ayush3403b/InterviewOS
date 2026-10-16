import { Router } from "express";

import { authController } from "../../../container";

import { validate } from "../../../middlewares/validate.middleware";

import { RegisterSchema } from "../validations/RegisterValidation";

import { ForgotPasswordSchema } from "../validations/ForgotPasswordValidation";

import { ResetPasswordSchema } from "../validations/ResetPasswordValidation";

import { RefreshTokenSchema } from "../validations/RefreshTokenValidation";

import { LoginSchema } from "../validations/LoginValidation";

import { LogoutSchema } from "../validations/LogoutValidation";

import { VerifyEmailSchema } from "../dtos/VerifyEmail.dto";

import { ResendVerificationSchema } from "../dtos/ResendVerification.dto";

import { authMiddleware } from "../../../middlewares/auth.middleware";
import { authRateLimiter } from "../../../middlewares/rateLimit.middleware";
import { captchaMiddleware } from "../../../middlewares/captcha.middleware";

const router = Router();

router.post(
    "/register",
    authRateLimiter,
    captchaMiddleware,
    validate(RegisterSchema),
    authController.register
);

router.post(
  "/login",
  authRateLimiter,
  captchaMiddleware,
  validate(LoginSchema),
  authController.login
);

router.post(
  "/send-verification",
  authRateLimiter,
  authMiddleware,
  authController.sendVerificationEmail
);

router.post(
  "/forgot-password",
  authRateLimiter,
  validate(ForgotPasswordSchema),
  authController.forgotPassword
);

router.post(
  "/verify-email",
  authRateLimiter,
  validate(VerifyEmailSchema),
  authController.verifyEmail
);

router.post(
  "/resend-verification",
  authRateLimiter,
  validate(ResendVerificationSchema),
  authController.resendVerificationEmail
);

router.post(
  "/reset-password",
  authRateLimiter,
  validate(ResetPasswordSchema),
  authController.resetPassword
);

router.post(
  "/refresh",
  validate(RefreshTokenSchema),
  authController.refreshToken
);

router.post(
  "/logout",
  validate(LogoutSchema),
  authController.logout
);

router.post(
  "/logout-all",
  authMiddleware,
  authController.logoutAll
);

router.get(
  "/sessions",
  authMiddleware,
  authController.getSessions
);


export default router;