import { Router } from "express";

import { conversationController } from "../../../container";

import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../../../middlewares/validate.middleware";

import {
  createConversationTurnSchema,
} from "../validations/CreateConversationTurn.validation";

import {
  updateConversationTurnSchema,
} from "../validations/UpdateConversationTurn.validation";


const router = Router();


router.post(
  "/",
  authMiddleware,
  validate(createConversationTurnSchema),
  conversationController.createTurn
);


router.get(
  "/session/:sessionId",
  authMiddleware,
  conversationController.getConversationHistory
);


router.get(
  "/session/:sessionId/latest",
  authMiddleware,
  conversationController.getLatestTurn
);


router.get(
  "/session/:sessionId/count",
  authMiddleware,
  conversationController.countTurns
);


router.get(
  "/:id",
  authMiddleware,
  conversationController.getConversationById
);


router.patch(
  "/:id/answer",
  authMiddleware,
  validate(updateConversationTurnSchema),
  conversationController.updateAnswer
);


router.patch(
  "/:id/transcript",
  authMiddleware,
  validate(updateConversationTurnSchema),
  conversationController.updateTranscript
);


router.patch(
  "/:id",
  authMiddleware,
  validate(updateConversationTurnSchema),
  conversationController.updateTurn
);


router.patch(
  "/:id/evaluate",
  authMiddleware,
  conversationController.markEvaluated
);


router.delete(
  "/:id",
  authMiddleware,
  conversationController.deleteTurn
);


export default router;