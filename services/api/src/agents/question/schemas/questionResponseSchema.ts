import { z } from "zod";

export const questionResponseSchema = z.object({
  question: z.string().min(1).max(1000),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  isFollowUp: z.boolean(),
  topic: z.string().min(1).max(200),
  rationale: z.string().max(1000).optional().default(""),
});

export type QuestionResponseShape = z.infer<typeof questionResponseSchema>;
