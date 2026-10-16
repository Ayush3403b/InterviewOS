import { Router } from "express";

import { auditLogController } from "../../../container";

import { authMiddleware } from "../../../middlewares/auth.middleware";
import { authorize } from "../../../middlewares/authorize.middleware";

import { UserRole } from "../../users/types/user.types";

const router = Router();

/**
 * Read-only, and deliberately narrow - this is a security/
 * investigation tool, not a general-purpose activity feed.
 * Recruiters get it too since they're the ones who'd need it to
 * review a disputed proctoring decision (who dismissed this event,
 * and when).
 */
router.get(
  "/",
  authMiddleware,
  authorize(UserRole.RECRUITER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  auditLogController.search
);

export default router;
