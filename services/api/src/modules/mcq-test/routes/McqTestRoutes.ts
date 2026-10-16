import { Router } from "express";
import multer from "multer";

import { mcqTestController } from "../../../container";

import { authMiddleware } from "../../../middlewares/auth.middleware";
import { authorize } from "../../../middlewares/authorize.middleware";
import { mcqGenerationRateLimiter } from "../../../middlewares/rateLimit.middleware";

import { ApiError } from "../../../shared/errors/ApiError";
import { ErrorCode } from "../../../shared/errors/ErrorCode";

import { TEST_AUTHOR_ROLES } from "../services/testAccess";
import {
  MATERIAL_LIMITS,
  MATERIAL_MIME_TYPES,
} from "../services/prepareStudyMaterial";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MATERIAL_LIMITS.maxFileBytes,
    files: MATERIAL_LIMITS.maxFiles,
  },
  fileFilter: (_req, file, callback) => {
    if (
      MATERIAL_MIME_TYPES.includes(
        file.mimetype as (typeof MATERIAL_MIME_TYPES)[number]
      )
    ) {
      callback(null, true);
      return;
    }

    callback(
      new ApiError(
        415,
        `"${file.originalname}" isn't supported. Upload PDFs or JPG/PNG/WEBP images.`,
        ErrorCode.BAD_REQUEST
      )
    );
  },
});

const router = Router();

// Everything here is for test authors. Candidates use /mcq-attempts.
router.use(authMiddleware, authorize(...TEST_AUTHOR_ROLES));

/* -------------------------------------------------------------------------- */
/*                                    CRUD                                     */
/* -------------------------------------------------------------------------- */

router.post("/", mcqTestController.createTest);

router.get("/", mcqTestController.listMyTests);

router.get("/:id", mcqTestController.getTest);

router.patch("/:id", mcqTestController.updateTest);

router.delete("/:id", mcqTestController.deleteTest);

/* -------------------------------------------------------------------------- */
/*                                  Questions                                  */
/* -------------------------------------------------------------------------- */

router.put("/:id/questions", mcqTestController.replaceQuestions);

router.post(
  "/:id/questions/generate",
  mcqGenerationRateLimiter,
  mcqTestController.generateFromTopics
);

router.post(
  "/:id/questions/import",
  mcqGenerationRateLimiter,
  upload.array("files", MATERIAL_LIMITS.maxFiles),
  mcqTestController.importFromMaterial
);

/* -------------------------------------------------------------------------- */
/*                                  Lifecycle                                  */
/* -------------------------------------------------------------------------- */

router.post("/:id/publish", mcqTestController.publishTest);

router.post("/:id/close", mcqTestController.closeTest);

router.post("/:id/reopen", mcqTestController.reopenTest);

router.post("/:id/revert-to-draft", mcqTestController.revertToDraft);

/* -------------------------------------------------------------------------- */
/*                                   Results                                   */
/* -------------------------------------------------------------------------- */

router.get("/:id/attempts", mcqTestController.listResults);

router.get("/:id/attempts/:attemptId", mcqTestController.getAttemptReview);

export default router;
