import { z } from "zod";

export const VerifyEmailSchema = z.object({
  body: z.object({
    token: z
      .string()
      .min(1, "Verification token is required"),
  }),

  params: z.object({}),

  query: z.object({}),
});

export type VerifyEmailDto = z.infer<
  typeof VerifyEmailSchema
>["body"];