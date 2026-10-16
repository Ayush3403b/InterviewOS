import { z } from "zod";

export const StartProctoringSessionSchema = z.object({
  interviewSessionId: z.string().min(1),

  organizationId: z.string().optional(),

  consentGiven: z.boolean().optional(),

  consentVersion: z.string().optional(),

  referenceFrame: z.string().optional(),
});

