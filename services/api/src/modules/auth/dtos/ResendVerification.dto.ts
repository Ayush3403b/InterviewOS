import { z } from "zod";

export const ResendVerificationSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .email("Invalid email address"),
  }),

  params: z.object({}),

  query: z.object({}),
});

export type ResendVerificationDto = z.infer<
  typeof ResendVerificationSchema
>["body"];