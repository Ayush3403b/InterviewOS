import { Router } from "express";

import { aiUsageController } from "../../../container";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const router = Router();

router.get("/summary", authMiddleware, aiUsageController.getUsageSummary);

router.get("/budget", authMiddleware, aiUsageController.getBudgetStatus);

router.get(
  "/session/:sessionId",
  authMiddleware,
  aiUsageController.getUsageForSession
);

export default router;
