import { Router } from "express";

import { userController } from "../../../container";

import { authMiddleware } from "../../../middlewares/auth.middleware";

import { validate } from "../../../middlewares/validate.middleware";

import { UpdateProfileSchema } from "../validations/UpdateProfileValidation";

import { ChangePasswordSchema } from "../validations/ChangePasswordValidation";

const router = Router();

router.get(
  "/me",
  authMiddleware,
  userController.me
);

router.patch(
  "/profile",
  authMiddleware,
  validate(UpdateProfileSchema),
  userController.updateProfile
);

router.patch(
  "/password",
  authMiddleware,
  validate(ChangePasswordSchema),
  userController.changePassword
);

export default router;