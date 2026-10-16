import { z } from "zod";

import {
  InstituteCategory,
  OrganizationVisibility,
} from "../types/organization.types";

export const UpdateOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3)
    .max(100)
    .optional(),

  category: z.nativeEnum(InstituteCategory).optional(),

  description: z
    .string()
    .trim()
    .max(1000)
    .optional(),

  email: z
    .string()
    .email()
    .optional(),

  phone: z
    .string()
    .trim()
    .min(8)
    .max(20)
    .optional(),

  website: z
    .string()
    .url()
    .optional(),

  logo: z
    .string()
    .url()
    .optional(),

  visibility: z
    .nativeEnum(OrganizationVisibility)
    .optional(),

  address: z
    .object({
      line1: z.string().optional(),
      line2: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      postalCode: z.string().optional(),
    })
    .optional(),
});

export type UpdateOrganizationValidation = z.infer<
  typeof UpdateOrganizationSchema
>;