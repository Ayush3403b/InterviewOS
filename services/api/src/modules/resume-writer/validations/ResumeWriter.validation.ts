import { z } from "zod";

export const GrammarCheckSchema = z.object({
  text: z.string().min(1).max(4000),
});

export const RewriteSchema = z.object({
  text: z.string().min(1).max(4000),
  targetRole: z.string().max(200).optional(),
});

export const MatchJDSchema = z.object({
  resumeText: z.string().min(10).max(20000),
  jobDescription: z.string().min(10).max(10000),
  targetRole: z.string().max(200).optional(),
});

const ExperienceItemSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  duration: z.string().min(1),
  location: z.string().optional(),
  bullets: z.array(z.string()).default([]),
});

const EducationItemSchema = z.object({
  degree: z.string().min(1),
  institution: z.string().min(1),
  year: z.string().min(1),
});

const ProjectItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  technologies: z.array(z.string()).optional(),
});

export const ExportResumePdfSchema = z.object({
  fullName: z.string().min(1).max(100),
  title: z.string().max(150).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(50).optional(),
  location: z.string().max(100).optional(),
  linkedin: z.string().max(200).optional(),
  github: z.string().max(200).optional(),
  website: z.string().max(200).optional(),
  summary: z.string().max(4000).optional(),
  skills: z.array(z.string()).optional(),
  experience: z.array(ExperienceItemSchema).optional(),
  education: z.array(EducationItemSchema).optional(),
  projects: z.array(ProjectItemSchema).optional(),
  certifications: z.array(z.string()).optional(),
});

export const GenerateResumeSchema = z.object({
  targetRole: z.string().min(2).max(200),
  experienceLevel: z.enum(["entry", "mid", "senior", "lead", "executive"]).default("mid"),
  yearsOfExperience: z.number().min(0).max(50).default(3),
  skills: z.array(z.string()).min(1).max(50),
  candidateName: z.string().max(100).optional(),
  industry: z.string().max(100).optional(),
  backgroundNotes: z.string().max(4000).optional(),
  jobDescription: z.string().max(10000).optional(),
});

export const OptimizeResumeSchema = z.object({
  resumeId: z.string().optional(),
  resumeText: z.string().max(25000).optional(),
  jobDescription: z.string().max(10000).optional(),
  targetRole: z.string().max(200).optional(),
  saveToMongo: z.boolean().optional(),
});
