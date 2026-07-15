import { z } from "zod";

export const ChangePasswordSchema = z.object({
  body: z.object({
    currentPassword: z
      .string()
      .min(8)
      .max(100),

    newPassword: z
      .string()
      .min(8)
      .max(100),

    confirmPassword: z
      .string()
      .min(8)
      .max(100),
  })
  .refine(
    (data) =>
      data.newPassword ===
      data.confirmPassword,
    {
      message:
        "Passwords do not match",
      path: ["confirmPassword"],
    }
  ),

  params: z.object({}),

  query: z.object({}),
});