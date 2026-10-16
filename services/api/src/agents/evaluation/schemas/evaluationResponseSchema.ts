import { z } from "zod";

import { HiringRecommendation } from "../../../modules/evaluation/types/evaluation.types";

const score = z.number().min(0).max(100);

export const evaluationResponseSchema = z.object({
  overallScore: score,

  skillScores: z.object({
    technical: score,
    communication: score,
    problemSolving: score,
    confidence: score,
    leadership: score,
    criticalThinking: score,
  }),

  strengths: z.array(z.string()).min(1),

  weaknesses: z.array(z.string()).min(1),

  recommendations: z.array(z.string()).min(1),

  overallSummary: z.string().min(1),

  hiringRecommendation: z.nativeEnum(HiringRecommendation),

  questionEvaluations: z.array(
    z.object({
      turnNumber: z.number().int(),
      question: z.string(),
      answer: z.string(),
      score,
      feedback: z.string(),
    })
  ),

  skillGaps: z
    .array(
      z.object({
        skill: z.string().min(1),
        currentLevel: score,
        targetLevel: score,
        priority: z.enum(["high", "medium", "low"]),
        actionableSteps: z.array(z.string()).min(1),
      })
    )
    .default([]),
});

export type EvaluationResponseShape = z.infer<typeof evaluationResponseSchema>;
