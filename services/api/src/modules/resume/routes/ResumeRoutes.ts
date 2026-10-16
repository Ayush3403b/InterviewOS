import { Router } from "express";
import multer from "multer";

import { resumeController } from "../../../container";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { ApiError } from "../../../shared/errors/ApiError";
import { ErrorCode } from "../../../shared/errors/ErrorCode";
import { SUPPORTED_RESUME_MIME_TYPES } from "../../../shared/files/extractResumeText";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (
      SUPPORTED_RESUME_MIME_TYPES.includes(
        file.mimetype as (typeof SUPPORTED_RESUME_MIME_TYPES)[number]
      )
    ) {
      callback(null, true);
      return;
    }

    callback(
      new ApiError(
        415,
        `Unsupported resume file type "${file.mimetype}". Upload a PDF or DOCX file.`,
        ErrorCode.BAD_REQUEST
      )
    );
  },
});

const router = Router();

router.post(
  "/",
  authMiddleware,
  upload.single("file"),
  resumeController.upload
);

router.get("/me", authMiddleware, resumeController.getMine);

router.post("/import/github", authMiddleware, resumeController.importGitHub);

router.post("/import/linkedin", authMiddleware, resumeController.importLinkedIn);

router.get("/versions", authMiddleware, resumeController.listVersions);

router.get("/github/repos", authMiddleware, resumeController.getGitHubRepos);

router.get("/compare", authMiddleware, resumeController.compareVersions);

router.get("/:id", authMiddleware, resumeController.getById);

router.patch("/:id", authMiddleware, resumeController.update);

export default router;
