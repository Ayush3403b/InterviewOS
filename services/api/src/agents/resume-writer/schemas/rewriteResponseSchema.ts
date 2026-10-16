import { z } from "zod";

export const rewriteResponseSchema = z.object({
  rewritten: z.string().min(1),
  explanation: z.string().min(1),
});

export type RewriteResponseShape = z.infer<typeof rewriteResponseSchema>;
