import { Router } from "express";

import { interviewSessionController } from "../../../container";

import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../../../middlewares/validate.middleware";

import { CreateInterviewSessionSchema } from "../validations/CreateInterviewSession.validation";
import { UpdateInterviewSessionSchema } from "../validations/UpdateInterviewSession.validation";

const router = Router();

/* -------------------------------------------------------------------------- */
/*                             Interview CRUD                                 */
/* -------------------------------------------------------------------------- */

router.post(
  "/",
  authMiddleware,
  validate(CreateInterviewSessionSchema),
  interviewSessionController.createSession
);

router.get(
  "/",
  authMiddleware,
  interviewSessionController.getMySessions
);

router.get(
  "/recent",
  authMiddleware,
  interviewSessionController.getRecentInterviews
);

router.get(
  "/statistics",
  authMiddleware,
  interviewSessionController.getStatistics
);

router.get(
  "/:id",
  authMiddleware,
  interviewSessionController.getSessionById
);

router.put(
  "/:id",
  authMiddleware,
  validate(UpdateInterviewSessionSchema),
  interviewSessionController.updateSession
);

/* -------------------------------------------------------------------------- */
/*                           Interview Lifecycle                              */
/* -------------------------------------------------------------------------- */

router.post(
  "/:id/start",
  authMiddleware,
  interviewSessionController.startSession
);

router.post(
  "/:id/pause",
  authMiddleware,
  interviewSessionController.pauseSession
);

router.post(
  "/:id/resume",
  authMiddleware,
  interviewSessionController.resumeSession
);

router.post(
  "/:id/cancel",
  authMiddleware,
  interviewSessionController.cancelSession
);

router.post(
  "/:id/complete",
  authMiddleware,
  interviewSessionController.completeSession
);

export default router;