import { Router } from "express";

import { authController } from "../../../container";

import { validate } from "../../../middlewares/validate.middleware";

import { RegisterSchema } from "../validations/RegisterValidation";

import { ForgotPasswordSchema } from "../validations/ForgotPasswordValidation";

import { LoginSchema } from "../validations/LoginValidation";

const router = Router();

router.post(
    "/register",
    validate(RegisterSchema),
    authController.register
);

router.post(
  "/login",
  validate(LoginSchema),
  authController.login
);

router.post(
  "/forgot-password",
  validate(ForgotPasswordSchema),
  authController.forgotPassword
);

export default router;