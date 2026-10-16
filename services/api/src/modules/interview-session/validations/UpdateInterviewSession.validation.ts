import { z } from "zod";

import {
  InterviewLevel,
  InterviewType,
} from "../types/interview-session.types";

export const UpdateInterviewSessionSchema = z.object({
  body: z.object({
    title: z
      .string()
      .trim()
      .min(3, "Title must contain at least 3 characters.")
      .max(150, "Title cannot exceed 150 characters.")
      .optional(),

    type: z
      .nativeEnum(InterviewType, {
        error: "Invalid interview type.",
      })
      .optional(),

    level: z
      .nativeEnum(InterviewLevel, {
        error: "Invalid interview level.",
      })
      .optional(),

    maxQuestions: z
      .number()
      .int()
      .min(1, "Minimum 1 question is required.")
      .max(50, "Maximum 50 questions are allowed.")
      .optional(),
  }),
});

export type UpdateInterviewSessionValidation = z.infer<
  typeof UpdateInterviewSessionSchema
>;