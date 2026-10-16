import { Router } from "express";
import { codingController } from "../../../container";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../../../middlewares/validate.middleware";
import { ExecuteCodeSchema, RunTestCasesSchema } from "../validations/Coding.validation";

const router = Router();

router.post(
  "/execute",
  authMiddleware,
  validate(ExecuteCodeSchema),
  codingController.execute
);

router.post(
  "/test-cases",
  authMiddleware,
  validate(RunTestCasesSchema),
  codingController.runTestCases
);

export default router;
