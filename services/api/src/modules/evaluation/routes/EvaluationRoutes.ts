import { Router } from "express";

import { evaluationController } from "../../../container";

import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../../../middlewares/validate.middleware";

import { createEvaluationSchema } from "../validations/createEvaluation.validation";
import { updateEvaluationSchema } from "../validations/updateEvaluation.validation";

const router = Router();

/* -------------------------------------------------------------------------- */
/*                             Evaluation CRUD                                */
/* -------------------------------------------------------------------------- */

router.post(
  "/",
  authMiddleware,
  validate(createEvaluationSchema),
  evaluationController.createEvaluation
);

router.get(
  "/:id",
  authMiddleware,
  evaluationController.getEvaluationById
);

router.put(
  "/:id",
  authMiddleware,
  validate(updateEvaluationSchema),
  evaluationController.updateEvaluation
);

router.delete(
  "/:id",
  authMiddleware,
  evaluationController.deleteEvaluation
);

/* -------------------------------------------------------------------------- */
/*                          Evaluation Queries                                */
/* -------------------------------------------------------------------------- */

router.get(
  "/interview/:interviewId",
  authMiddleware,
  evaluationController.getEvaluationByInterview
);

router.get(
  "/candidate/:candidateId",
  authMiddleware,
  evaluationController.getCandidateEvaluations
);

router.get(
  "/organization/:organizationId",
  authMiddleware,
  evaluationController.getOrganizationEvaluations
);

/* -------------------------------------------------------------------------- */
/*                        Evaluation Lifecycle                                */
/* -------------------------------------------------------------------------- */

router.post(
  "/:id/generate",
  authMiddleware,
  evaluationController.generateEvaluation
);

router.post(
  "/:id/publish",
  authMiddleware,
  evaluationController.publishEvaluation
);

router.post(
  "/:id/reset",
  authMiddleware,
  evaluationController.resetEvaluation
);

/* -------------------------------------------------------------------------- */
/*                            Statistics                                      */
/* -------------------------------------------------------------------------- */

router.get(
  "/statistics/candidate/:candidateId",
  authMiddleware,
  evaluationController.getCandidateStatistics
);

router.get(
  "/statistics/organization/:organizationId",
  authMiddleware,
  evaluationController.getOrganizationStatistics
);

export default router;