import { Router } from "express";

import { orchestratorController } from "../../../container";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../../../middlewares/validate.middleware";

import {
  finishInterviewSchema,
  submitAnswerSchema,
} from "../validations/orchestrator.validation";

const router = Router();

router.get(
  "/sessions/:sessionId/next-question",
  authMiddleware,
  orchestratorController.getNextQuestion
);

router.post(
  "/turns/:turnId/answer",
  authMiddleware,
  validate(submitAnswerSchema),
  orchestratorController.submitAnswer
);

router.post(
  "/sessions/:sessionId/finish",
  authMiddleware,
  validate(finishInterviewSchema),
  orchestratorController.finishInterview
);

export default router;
