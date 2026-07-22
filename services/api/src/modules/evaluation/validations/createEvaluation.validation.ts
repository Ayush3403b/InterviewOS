import { z } from "zod";

export const createEvaluationSchema = z.object({
  body: z.object({
    interviewSessionId: z.string().min(1, "Interview Session ID is required"),

    organizationId: z.string().min(1, "Organization ID is required"),

    candidateId: z.string().min(1, "Candidate ID is required"),
  }),
});

export type CreateEvaluationRequest = z.infer<
  typeof createEvaluationSchema
>["body"];