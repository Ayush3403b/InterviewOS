import {
  EducationEntry,
  ExperienceEntry,
  ProjectEntry,
  ResumeDocument,
  ResumeStatus,
} from "../types/resume.types";
import {
  CertificationAnalysis,
  EducationAnalysis,
  ExperienceAnalysis,
  ProjectAnalysis,
  SkillsGapAnalysis,
} from "../../../agents/resume/analysis/resumeInsights.types";

export interface ResumeResponseDto {
  id: string;
  fileName: string;
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
  experienceAnalysis?: ExperienceAnalysis;
  educationAnalysis?: EducationAnalysis;
  projectAnalysis?: ProjectAnalysis;
  certificationAnalysis?: CertificationAnalysis;
  skillsGapAnalysis?: SkillsGapAnalysis;
  failureReason?: string;
  createdAt: Date;
}

export function toResumeResponse(resume: ResumeDocument): ResumeResponseDto {
  return {
    id: resume.id,
    fileName: resume.fileName,
    status: resume.status,
    summary: resume.summary,
    extractedSkills: resume.extractedSkills,
    atsScore: resume.atsScore,
    suggestions: resume.suggestions,
    experience: resume.experience,
    education: resume.education,
    projects: resume.projects,
    certifications: resume.certifications,
    missingSkills: resume.missingSkills,
    experienceAnalysis: resume.experienceAnalysis,
    educationAnalysis: resume.educationAnalysis,
    projectAnalysis: resume.projectAnalysis,
    certificationAnalysis: resume.certificationAnalysis,
    skillsGapAnalysis: resume.skillsGapAnalysis,
    failureReason: resume.failureReason,
    createdAt: resume.createdAt,
  };
}

/** Lightweight - for the version-history list, not the full detail view. */
export interface ResumeVersionSummaryDto {
  id: string;
  fileName: string;
  status: ResumeStatus;
  atsScore?: number;
  createdAt: Date;
}

export function toResumeVersionSummary(
  resume: ResumeDocument
): ResumeVersionSummaryDto {
  return {
    id: resume.id,
    fileName: resume.fileName,
    status: resume.status,
    atsScore: resume.atsScore,
    createdAt: resume.createdAt,
  };
}

export interface ResumeVersionListDto {
  versions: ResumeVersionSummaryDto[];
  total: number;
  page: number;
  limit: number;
}

export function toResumeVersionList(result: {
  versions: ResumeDocument[];
  total: number;
  page: number;
  limit: number;
}): ResumeVersionListDto {
  return {
    versions: result.versions.map((resume) => toResumeVersionSummary(resume)),
    total: result.total,
    page: result.page,
    limit: result.limit,
  };
}
