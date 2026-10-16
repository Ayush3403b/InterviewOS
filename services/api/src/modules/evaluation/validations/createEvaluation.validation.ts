import { z } from "zod";

export const createEvaluationSchema = z.object({
  body: z.object({
    interviewSessionId: z.string().min(1),

    organizationId: z.string().min(1).optional(),

    candidateId: z.string().min(1),
  }),
});

export type CreateEvaluationInput =
  z.infer<typeof createEvaluationSchema>["body"];


  