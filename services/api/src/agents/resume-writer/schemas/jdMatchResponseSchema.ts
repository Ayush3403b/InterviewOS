import { z } from "zod";

export const tailoredBulletSchema = z.object({
  originalBullet: z.string().optional(),
  tailoredBullet: z.string().min(1),
  highlightedKeywords: z.array(z.string()).default([]),
  rationale: z.string().min(1),
});

export const jdMatchResponseSchema = z.object({
  matchScore: z.number().int().min(0).max(100),
  targetRole: z.string().default("Target Role"),
  matchingKeywords: z.array(z.string()).default([]),
  missingKeywords: z.array(z.string()).default([]),
  tailoredSummary: z.string().default(""),
  tailoredBulletPoints: z.array(tailoredBulletSchema).default([]),
  recommendations: z.array(z.string()).default([]),
});

export type JDMatchResponseDto = z.infer<typeof jdMatchResponseSchema>;
