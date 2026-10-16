import { Router } from "express";

import { proctoringController } from "../../../container";

import { authMiddleware } from "../../../middlewares/auth.middleware";
import { authorize } from "../../../middlewares/authorize.middleware";
import { validate } from "../../../middlewares/validate.middleware";
import { signalRateLimiter } from "../../../middlewares/rateLimit.middleware";

import { StartProctoringSessionSchema } from "../validations/StartProctoringSession.validation";
import { RecordSignalSchema } from "../validations/RecordSignal.validation";
import { UpdateEventStatusSchema } from "../validations/UpdateEventStatus.validation";

import { UserRole } from "../../users/types/user.types";

const router = Router();

/* -------------------------------------------------------------------------- */
/*                              Session Lifecycle                             */
/* -------------------------------------------------------------------------- */

router.post(
  "/sessions",
  authMiddleware,
  validate(StartProctoringSessionSchema),
  proctoringController.startSession
);

router.post(
  "/sessions/:interviewSessionId/complete",
  authMiddleware,
  proctoringController.completeSession
);

router.post(
  "/sessions/:interviewSessionId/terminate",
  authMiddleware,
  authorize(
    UserRole.RECRUITER,
    UserRole.FACULTY,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  proctoringController.terminateSession
);

/* -------------------------------------------------------------------------- */
/*                 Signal Ingestion (HTTP fallback for sockets)                */
/* -------------------------------------------------------------------------- */

router.post(
  "/sessions/:interviewSessionId/signal",
  authMiddleware,
  signalRateLimiter,
  validate(RecordSignalSchema),
  proctoringController.recordSignal
);

/* -------------------------------------------------------------------------- */
/*                                  Reporting                                  */
/* -------------------------------------------------------------------------- */

router.get(
  "/sessions/flagged",
  authMiddleware,
  authorize(
    UserRole.RECRUITER,
    UserRole.FACULTY,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  proctoringController.getFlaggedSessions
);

router.get(
  "/sessions/:interviewSessionId",
  authMiddleware,
  proctoringController.getSession
);

router.get(
  "/sessions/:interviewSessionId/events",
  authMiddleware,
  proctoringController.getEvents
);

router.get(
  "/sessions/:interviewSessionId/report",
  authMiddleware,
  proctoringController.getReport
);

router.get(
  "/sessions/:interviewSessionId/timeline",
  authMiddleware,
  proctoringController.getTimeline
);

router.patch(
  "/sessions/:interviewSessionId/events/:eventId/status",
  authMiddleware,
  authorize(
    UserRole.RECRUITER,
    UserRole.FACULTY,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validate(UpdateEventStatusSchema),
  proctoringController.updateEventStatus
);

export default router;
