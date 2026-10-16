import { Router } from "express";

import { reportController } from "../../../container";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const router = Router();

router.post(
  "/sessions/:sessionId/generate",
  authMiddleware,
  reportController.generate
);

router.get(
  "/sessions/:sessionId",
  authMiddleware,
  reportController.getForSession
);

router.get(
  "/sessions/:sessionId/pdf",
  authMiddleware,
  reportController.downloadPdf
);

router.post(
  "/sessions/:sessionId/share",
  authMiddleware,
  reportController.createShareLink
);

router.delete(
  "/sessions/:sessionId/share",
  authMiddleware,
  reportController.revokeShareLink
);

router.get(
  "/public/:shareToken",
  reportController.getByShareToken
);

export default router;
