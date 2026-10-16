import { z } from "zod";

export const submitAnswerSchema = z.object({
  answer: z.string().min(1).max(10000),
  timeTaken: z.number().min(0).optional(),
  sessionId: z.string().min(1),
});

export const finishInterviewSchema = z.object({
  durationSeconds: z.number().min(0),
});
