import { z } from "zod";

import { EvaluationStatus } from "../types/evaluation.types";

export const updateEvaluationSchema = z.object({
  body: z.object({
    status: z.nativeEnum(EvaluationStatus).optional(),

    overallScore: z
      .number()
      .min(0)
      .max(100)
      .optional(),

    scores: z
      .object({
        communication: z.number().min(0).max(100).optional(),

        technical: z.number().min(0).max(100).optional(),

        problemSolving: z.number().min(0).max(100).optional(),

        confidence: z.number().min(0).max(100).optional(),
      })
      .optional(),

    feedback: z
      .string()
      .trim()
      .optional(),

    provider: z
      .string()
      .trim()
      .optional(),

    llmModel: z
      .string()
      .trim()
      .optional(),

    tokensUsed: z
      .number()
      .min(0)
      .optional(),

    evaluationTime: z
      .number()
      .min(0)
      .optional(),

    metadata: z
      .record(z.string(), z.unknown())
      .optional(),

    publishedAt: z
      .coerce
      .date()
      .optional(),
  }),
});

export type UpdateEvaluationRequest = z.infer<
  typeof updateEvaluationSchema
>["body"];