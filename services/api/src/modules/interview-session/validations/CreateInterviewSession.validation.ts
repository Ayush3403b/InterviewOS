import { z } from "zod";

import {
  InterviewLevel,
  InterviewType,
} from "../types/interview-session.types";

export const CreateInterviewSessionSchema = z.object({
  body: z.object({
    title: z
      .string()
      .trim()
      .min(3, "Title must contain at least 3 characters.")
      .max(150, "Title cannot exceed 150 characters."),

    type: z.nativeEnum(InterviewType, {
      error: "Invalid interview type.",
    }),

    level: z.nativeEnum(InterviewLevel, {
      error: "Invalid interview level.",
    }),

    maxQuestions: z
      .number()
      .int()
      .min(1, "Minimum 1 question is required.")
      .max(50, "Maximum 50 questions are allowed.")
      .optional(),
  }),
});

export type CreateInterviewSessionValidation = z.infer<
  typeof CreateInterviewSessionSchema
>;