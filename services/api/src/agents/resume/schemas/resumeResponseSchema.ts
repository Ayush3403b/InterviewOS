import { z } from "zod";

const experienceEntrySchema = z.object({
  title: z.string(),
  company: z.string(),
  duration: z.string(),
  highlights: z.array(z.string()),
});

const educationEntrySchema = z.object({
  degree: z.string(),
  institution: z.string(),
  year: z.string(),
});

const projectEntrySchema = z.object({
  name: z.string(),
  description: z.string(),
  technologies: z.array(z.string()),
});

export const resumeResponseSchema = z.object({
  summary: z.string().min(1),
  extractedSkills: z.array(z.string()),
  atsScore: z.number().min(0).max(100),
  suggestions: z.array(z.string()).min(1),
  experience: z.array(experienceEntrySchema),
  education: z.array(educationEntrySchema),
  projects: z.array(projectEntrySchema),
  certifications: z.array(z.string()),
  missingSkills: z.array(z.string()),
});

export type ResumeResponseShape = z.infer<typeof resumeResponseSchema>;
