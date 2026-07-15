import { Router } from "express";

import HealthController from "../controllers/HealthController";
import { validate } from "../../../middlewares/validate.middleware";
import { HealthSchema } from "../validations/HealthValidation";

const router = Router();

router.get(
  "/",
  validate(HealthSchema),
  HealthController.getHealth
);

export default router;