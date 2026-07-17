import { z } from "zod";

export const ResetPasswordSchema = z.object({
  body: z.object({
    token: z
      .string()
      .min(1),

    password: z
      .string()
      .min(8)
      .max(100),

    confirmPassword: z
      .string()
      .min(8)
      .max(100),
  }).refine(
    (data) => data.password === data.confirmPassword,
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }
  ),

  params: z.object({}),

  query: z.object({}),
});