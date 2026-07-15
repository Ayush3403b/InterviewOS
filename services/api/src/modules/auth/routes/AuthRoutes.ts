import { Router } from "express";

import { authController } from "../../../container";

import { validate } from "../../../middlewares/validate.middleware";

import { RegisterSchema } from "../validations/RegisterValidation";

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

export default router;