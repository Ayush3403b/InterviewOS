import { Router } from "express";

import { coachController } from "../../../container";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const router = Router();

router.post(
  "/sessions/:sessionId/generate",
  authMiddleware,
  coachController.generate
);

router.get(
  "/sessions/:sessionId",
  authMiddleware,
  coachController.getForSession
);

export default router;
