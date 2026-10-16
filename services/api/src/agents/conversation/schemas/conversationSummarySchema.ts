import { z } from "zod";

export const conversationSummarySchema = z.object({
  summary: z.string().min(1).max(3000),
  newTopics: z.array(z.string().min(1).max(100)).max(20).default([]),
  answerQuality: z.number().min(0).max(100),
});

export type ConversationSummaryShape = z.infer<
  typeof conversationSummarySchema
>;
