import { z } from "zod";

export const LoginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email("Invalid email address")
      .trim()
      .toLowerCase(),

    password: z
      .string()
      .min(8, "Password must contain at least 8 characters"),
  }),

  params: z.object({}),

  query: z.object({}),
});