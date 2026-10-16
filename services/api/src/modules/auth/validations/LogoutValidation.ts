import { z } from "zod";

export const LogoutSchema = z.object({
  body: z.object({
    refreshToken: z
      .string()
      .min(1),
  }),

  params: z.object({}),

  query: z.object({}),
});