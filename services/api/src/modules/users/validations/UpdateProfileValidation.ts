import { z } from "zod";

export const UpdateProfileSchema = z.object({
  body: z.object({
    firstName: z
      .string()
      .trim()
      .min(2)
      .max(50)
      .optional(),

    lastName: z
      .string()
      .trim()
      .min(2)
      .max(50)
      .optional(),

    avatar: z
      .string()
      .url()
      .optional(),

    organizationId: z
      .string()
      .optional(),
  }),

  params: z.object({}),

  query: z.object({}),
});