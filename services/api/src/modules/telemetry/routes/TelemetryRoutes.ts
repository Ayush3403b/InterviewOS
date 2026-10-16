import { Router } from "express";

import { telemetryController } from "../../../container";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { authorize } from "../../../middlewares/authorize.middleware";
import { UserRole } from "../../users/types/user.types";

const router = Router();

router.get(
  "/errors",
  authMiddleware,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  telemetryController.getErrorSummary
);

export default router;
