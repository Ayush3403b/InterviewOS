import { Router } from "express";

import { mcqAttemptController } from "../../../container";

import { authMiddleware } from "../../../middlewares/auth.middleware";

const router = Router();

// Any signed-in user can take a test they have the code for.
router.use(authMiddleware);

router.get("/mine", mcqAttemptController.listMyAttempts);

router.get("/access/:code", mcqAttemptController.previewByCode);

/** Starts the attempt, or returns the caller's existing one. */
router.post("/access/:code", mcqAttemptController.startAttempt);

router.get("/:attemptId", mcqAttemptController.getMyAttempt);

router.put("/:attemptId/answers", mcqAttemptController.saveAnswer);

router.post("/:attemptId/submit", mcqAttemptController.submitAttempt);

export default router;
