import { z } from "zod";

import {
  InstituteCategory,
  OrganizationType,
  OrganizationVisibility,
} from "../types/organization.types";

export const CreateOrganizationSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Organization name must be at least 3 characters.")
      .max(100, "Organization name cannot exceed 100 characters."),

    type: z.nativeEnum(OrganizationType),

    category: z.nativeEnum(InstituteCategory).optional(),

    description: z
      .string()
      .trim()
      .max(1000, "Description cannot exceed 1000 characters.")
      .optional(),

    email: z.string().email("Invalid email address.").optional(),

    phone: z
      .string()
      .trim()
      .min(8)
      .max(20)
      .optional(),

    website: z.string().url("Invalid website URL.").optional(),

    logo: z.string().url("Invalid logo URL.").optional(),

    visibility: z
      .nativeEnum(OrganizationVisibility)
      .default(OrganizationVisibility.PUBLIC),

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
  })
  .superRefine((data, ctx) => {
    if (
      data.type === OrganizationType.INSTITUTE &&
      !data.category
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["category"],
        message:
          "Institute category is required for institute organizations.",
      });
    }
  });

export type CreateOrganizationValidation = z.infer<
  typeof CreateOrganizationSchema
>;