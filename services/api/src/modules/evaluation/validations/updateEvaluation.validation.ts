import { z } from "zod";

export const updateEvaluationSchema = z.object({
  body: z.object({
    overallScore: z.number().min(0).max(100).optional(),

    overallSummary: z.string().optional(),

    strengths: z.array(z.string()).optional(),

    weaknesses: z.array(z.string()).optional(),

    recommendations: z.array(z.string()).optional(),

    hiringRecommendation: z.string().optional(),
  }),
});

export type UpdateEvaluationInput =
  z.infer<typeof updateEvaluationSchema>["body"];