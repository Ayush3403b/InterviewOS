import { z } from "zod";

const roadmapItemSchema = z.object({
  topic: z.string(),
  action: z.string(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
});

const resourceSchema = z.object({
  title: z.string(),
  type: z.enum(["COURSE", "ARTICLE", "PRACTICE", "VIDEO"]),
  reason: z.string(),
  url: z.string().optional(),
});

export const coachResponseSchema = z.object({
  personalizedFeedback: z.string().min(1),
  weakTopics: z.array(z.string()),
  learningRoadmap: z.array(roadmapItemSchema).min(1),
  recommendedResources: z.array(resourceSchema).min(1),
  careerGuidance: z.string().min(1),
});

export type CoachResponseShape = z.infer<typeof coachResponseSchema>;
