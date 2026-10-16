import { z } from "zod";

export type GrammarIssueType =
  | "passive_voice"
  | "weak_opener"
  | "no_quantification"
  | "personal_pronoun"
  | "repeated_word"
  | "sentence_too_long"
  | "other";

export interface GrammarIssueDto {
  type: GrammarIssueType;
  excerpt?: string;
  message: string;
  suggestion?: string;
}

export interface GrammarCheckResultDto {
  score: number;
  issues: GrammarIssueDto[];
}

export interface RewriteResultDto {
  original: string;
  rewritten: string;
  explanation: string;
}

export interface TailoredBulletPointDto {
  originalBullet?: string;
  tailoredBullet: string;
  highlightedKeywords: string[];
  rationale: string;
}

export interface JDMatchResultDto {
  matchScore: number;
  targetRole: string;
  matchingKeywords: string[];
  missingKeywords: string[];
  tailoredSummary: string;
  tailoredBulletPoints: TailoredBulletPointDto[];
  recommendations: string[];
}

export interface ExportResumeItemDto {
  title: string;
  company: string;
  duration: string;
  location?: string;
  bullets: string[];
}

export interface ExportResumeDto {
  fullName: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  summary?: string;
  skills?: string[];
  experience?: ExportResumeItemDto[];
  education?: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  projects?: Array<{
    name: string;
    description: string;
    technologies?: string[];
  }>;
  certifications?: string[];
}

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

export interface GitHubRepositoryItemDto {
  name: string;
  description: string;
  language: string;
  stars: number;
  url: string;
  topics: string[];
}

export interface GenerateResumeRequestDto {
  resumeId?: string;
  resumeText?: string;
  targetRole: string;
  experienceLevel: "entry" | "mid" | "senior" | "lead" | "executive";
  yearsOfExperience: number;
  skills: string[];
  candidateName?: string;
  industry?: string;
  backgroundNotes?: string;
  jobDescription?: string;
  githubUsername?: string;
  linkedinUrl?: string;
  realExperience?: Array<{
    title?: string;
    company: string;
    duration?: string;
    highlights?: string[];
  }>;
  realEducation?: Array<{
    degree?: string;
    institution: string;
    year?: string;
  }>;
  rawResumeText?: string;
  selectedProjects?: Array<{
    name: string;
    description: string;
    technologies: string[];
    url?: string;
    stars?: number;
  }>;
}

export interface GeneratedResumeResultDto {
  fullName: string;
  targetRole: string;
  summary: string;
  skills: string[];
  atsScore: number;
  github?: string;
  linkedin?: string;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    highlights: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    url?: string;
    stars?: number;
  }>;
  certifications: string[];
  atsOptimizationNotes: string[];
}

export interface AiOptimizeResumeRequestDto {
  resumeId?: string;
  resumeText?: string;
  jobDescription?: string;
  targetRole?: string;
  saveToMongo?: boolean;
}

export interface AiOptimizeResumeResultDto {
  resumeId?: string;
  originalAtsScore: number;
  optimizedAtsScore: number;
  scoreImprovement: number;
  matchedKeywords: string[];
  addedKeywords: string[];
  improvedSummary: string;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    highlights: string[];
  }>;
  skills: string[];
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  certifications: string[];
  enhancementsSummary: string[];
  mongoUpdated?: boolean;
}

export const GenerateResumeSchema = z.object({
  resumeId: z.string().optional(),
  resumeText: z.string().max(25000).optional(),
  targetRole: z.string().min(2).max(200),
  experienceLevel: z.enum(["entry", "mid", "senior", "lead", "executive"]).default("mid"),
  yearsOfExperience: z.number().min(0).max(50).default(3),
  skills: z.array(z.string()).min(1).max(50),
  candidateName: z.string().max(100).optional(),
  industry: z.string().max(100).optional(),
  backgroundNotes: z.string().max(4000).optional(),
  jobDescription: z.string().max(10000).optional(),
  githubUsername: z.string().max(100).optional(),
  linkedinUrl: z.string().max(300).optional(),
  selectedProjects: z
    .array(
      z.object({
        name: z.string().max(100),
        description: z.string().max(1000),
        technologies: z.array(z.string()).max(20),
        url: z.string().max(300).optional(),
        stars: z.number().optional(),
      })
    )
    .max(5)
    .optional(),
});

export const OptimizeResumeSchema = z.object({
  resumeId: z.string().optional(),
  resumeText: z.string().max(25000).optional(),
  jobDescription: z.string().max(10000).optional(),
  targetRole: z.string().max(200).optional(),
  saveToMongo: z.boolean().optional(),
});
