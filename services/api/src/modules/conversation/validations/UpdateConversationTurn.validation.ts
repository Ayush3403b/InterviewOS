import { z } from "zod";
import { ConversationStatus } from "../types/conversation.types";

export const updateConversationTurnSchema = z.object({
  body: z.object({
    answer: z
      .string()
      .trim()
      .max(10000)
      .optional(),

    speechTranscript: z
      .string()
      .trim()
      .max(10000)
      .optional(),

    status: z
      .nativeEnum(ConversationStatus)
      .optional(),

    timeTaken: z
      .number()
      .min(0)
      .optional(),

    tokensUsed: z
      .number()
      .min(0)
      .optional(),

    provider: z
      .string()
      .trim()
      .max(100)
      .optional(),

    llmmodel: z
      .string()
      .trim()
      .max(100)
      .optional(),

    metadata: z
      .record(z.string(), z.unknown())
      .optional(),
  }),
});