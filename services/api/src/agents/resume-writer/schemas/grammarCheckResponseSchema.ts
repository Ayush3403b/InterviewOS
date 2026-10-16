import { z } from "zod";

const grammarIssueSchema = z.object({
  type: z.enum([
    "passive_voice",
    "weak_opener",
    "no_quantification",
    "personal_pronoun",
    "repeated_word",
    "sentence_too_long",
    "other",
  ]),
  excerpt: z.string().optional(),
  message: z.string().min(1),
  suggestion: z.string().optional(),
});

export const grammarCheckResponseSchema = z.object({
  score: z.number().min(0).max(100),
  issues: z.array(grammarIssueSchema),
});

export type GrammarCheckResponseShape = z.infer<typeof grammarCheckResponseSchema>;
