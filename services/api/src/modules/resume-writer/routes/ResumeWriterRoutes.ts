import { Router } from "express";

import { resumeWriterController } from "../../../container";

import { authMiddleware } from "../../../middlewares/auth.middleware";
import { resumeWriterRateLimiter } from "../../../middlewares/rateLimit.middleware";
import { validate } from "../../../middlewares/validate.middleware";

import {
  GrammarCheckSchema,
  RewriteSchema,
  MatchJDSchema,
  ExportResumePdfSchema,
  GenerateResumeSchema,
  OptimizeResumeSchema,
} from "../validations/ResumeWriter.validation";

const router = Router();

router.post(
  "/generate",
  authMiddleware,
  resumeWriterRateLimiter,
  validate(GenerateResumeSchema),
  resumeWriterController.generate
);

router.post(
  "/optimize",
  authMiddleware,
  resumeWriterRateLimiter,
  validate(OptimizeResumeSchema),
  resumeWriterController.optimize
);

router.post(
  "/grammar-check",
  authMiddleware,
  resumeWriterRateLimiter,
  validate(GrammarCheckSchema),
  resumeWriterController.checkGrammar
);

router.post(
  "/rewrite",
  authMiddleware,
  resumeWriterRateLimiter,
  validate(RewriteSchema),
  resumeWriterController.rewrite
);

router.post(
  "/match-jd",
  authMiddleware,
  resumeWriterRateLimiter,
  validate(MatchJDSchema),
  resumeWriterController.matchJobDescription
);

router.post(
  "/export-pdf",
  authMiddleware,
  resumeWriterRateLimiter,
  validate(ExportResumePdfSchema),
  resumeWriterController.exportResumePdf
);

export default router;
