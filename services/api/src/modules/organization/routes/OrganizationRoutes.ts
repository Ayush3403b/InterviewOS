import { Router } from "express";

import { organizationController } from "../../../container";

import { authMiddleware } from "../../../middlewares/auth.middleware";

import { validate } from "../../../middlewares/validate.middleware";

import { CreateOrganizationSchema } from "../validations/CreateOrganization.validation";
import { UpdateOrganizationSchema } from "../validations/UpdateOrganization.validation";

const router = Router();

/**
 * Create Organization
 */
router.post(
  "/",
  authMiddleware,
  validate(CreateOrganizationSchema),
  organizationController.createOrganization
);

/**
 * Get All Organizations
 */
router.get(
  "/",
  authMiddleware,
  organizationController.getOrganizations
);

/**
 * Get Organization By Slug
 */
router.get(
  "/slug/:slug",
  authMiddleware,
  organizationController.getOrganizationBySlug
);

/**
 * Get Organization By Id
 */
router.get(
  "/:id",
  authMiddleware,
  organizationController.getOrganizationById
);

/**
 * Update Organization
 */
router.patch(
  "/:id",
  authMiddleware,
  validate(UpdateOrganizationSchema),
  organizationController.updateOrganization
);

/**
 * Soft Delete Organization
 */
router.delete(
  "/:id",
  authMiddleware,
  organizationController.deleteOrganization
);

/**
 * Restore Organization
 */
router.patch(
  "/:id/restore",
  authMiddleware,
  organizationController.restoreOrganization
);

export default router;