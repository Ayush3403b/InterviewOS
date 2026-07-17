import { z } from "zod";

export const RefreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z
      .string()
      .min(1),
  }),

  params: z.object({}),

  query: z.object({}),
});