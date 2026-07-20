import { z } from "zod";
import {
  ConversationRole,
  ConversationStatus,
} from "../types/conversation.types";

export const createConversationTurnSchema = z.object({
  body: z.object({
    sessionId: z.string().min(1, "Session ID is required"),

    turnNumber: z
      .number()
      .int()
      .positive("Turn number must be greater than 0"),

    role: z.nativeEnum(ConversationRole),

    question: z
      .string()
      .trim()
      .min(1, "Question is required")
      .max(5000),

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