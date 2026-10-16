import { Document, Types } from "mongoose";

import {
  CertificationAnalysis,
  EducationAnalysis,
  ExperienceAnalysis,
  ProjectAnalysis,
  SkillsGapAnalysis,
} from "../../../agents/resume/analysis/resumeInsights.types";

export enum ResumeStatus {
  PROCESSING = "PROCESSING",
  PARSED = "PARSED",
  FAILED = "FAILED",
}

export interface ExperienceEntry {
  title: string;
  company: string;
  duration: string;
  highlights: string[];
}

export interface EducationEntry {
  degree: string;
  institution: string;
  year: string;
}

export interface ProjectEntry {
  name: string;
  description: string;
  technologies: string[];
}

export interface ResumeDocument extends Document {
  userId: Types.ObjectId;
  fileName: string;
  mimeType: string;
  rawText: string;
  status: ResumeStatus;
  summary?: string;
  extractedSkills: string[];
  atsScore?: number;
  suggestions: string[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  projects: ProjectEntry[];
  certifications: string[];
  missingSkills: string[];

  /** Rule-based analysis derived from the fields above - see
   *  agents/resume/analysis/deriveResumeInsights.ts. Undefined until
   *  the resume has finished parsing. */
  experienceAnalysis?: ExperienceAnalysis;
  educationAnalysis?: EducationAnalysis;
  projectAnalysis?: ProjectAnalysis;
  certificationAnalysis?: CertificationAnalysis;
  skillsGapAnalysis?: SkillsGapAnalysis;

  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
