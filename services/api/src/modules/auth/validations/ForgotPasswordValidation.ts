import { z } from "zod";

export const ForgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .email(),
  }),

  params: z.object({}),

  query: z.object({}),
});