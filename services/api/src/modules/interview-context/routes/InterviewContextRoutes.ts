import { Router } from "express";

import { interviewContextController } from "../../../container";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const router = Router();

router.get(
  "/:sessionId",
  authMiddleware,
  interviewContextController.getContext
);

export default router;
