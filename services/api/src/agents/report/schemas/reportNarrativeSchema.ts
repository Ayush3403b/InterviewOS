import { z } from "zod";

export const reportNarrativeSchema = z.object({
  executiveSummary: z.string().min(1),
  candidateFeedback: z.string().min(1),
  recruiterBrief: z.string().min(1),
  executiveDigest: z.string().min(1),
});

export type ReportNarrativeShape = z.infer<typeof reportNarrativeSchema>;
