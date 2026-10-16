/** Mirrors ResumeStatus (modules/resume/types/resume.types.ts). */
export type ResumeStatus = "PROCESSING" | "PARSED" | "FAILED";

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

export type SeniorityLevel = "entry" | "mid" | "senior" | "lead";
export type DegreeLevel = "unknown" | "bachelor" | "master" | "phd";

export interface ExperienceAnalysis {
  totalYearsExperience: number;
  seniorityLevel: SeniorityLevel;
  averageTenureYears: number;
  employmentGaps: Array<{ afterYear: number; beforeYear: number; gapYears: number }>;
  entriesWithParsedDates: number;
}

export interface EducationAnalysis {
  highestDegreeLevel: DegreeLevel;
  degreeCount: number;
}

export interface ProjectAnalysis {
  totalProjects: number;
  hasQuantifiedImpact: boolean;
  distinctTechnologiesUsed: number;
  complexityScore: number;
}

export interface CertificationAnalysis {
  totalCertifications: number;
  recognizedCertifications: string[];
  recommendation: string;
}

export interface SkillsGapAnalysis {
  inferredRoleFamily: string | null;
  matchedSkillsForRole: string[];
  missingSkillsForRole: string[];
}

/** Mirrors ResumeResponseDto (modules/resume/dtos/ResumeResponse.ts). */
export interface ResumeAnalysis {
  id: string;
  fileName: string;
  status: ResumeStatus;
  rawText?: string;
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
  createdAt: string;
}

/** Mirrors ResumeVersionSummaryDto - the lightweight version-history list. */
export interface ResumeVersionSummary {
  id: string;
  fileName: string;
  status: ResumeStatus;
  atsScore?: number;
  createdAt: string;
}

export interface ResumeVersionList {
  versions: ResumeVersionSummary[];
  total: number;
  page: number;
  limit: number;
}

/** Mirrors ResumeComparison (modules/resume/services/ResumeComparator.ts). */
export interface ResumeComparison {
  from: { id: string; fileName: string; createdAt: string };
  to: { id: string; fileName: string; createdAt: string };
  atsScoreDelta: number | null;
  skillsAdded: string[];
  skillsRemoved: string[];
  experienceYearsDelta: number | null;
  seniorityChanged: boolean;
  seniorityFrom: SeniorityLevel | null;
  seniorityTo: SeniorityLevel | null;
  educationDegreeChanged: boolean;
  degreeFrom: DegreeLevel | null;
  degreeTo: DegreeLevel | null;
  projectsCountDelta: number | null;
  projectComplexityDelta: number | null;
  certificationsCountDelta: number | null;
  newRecognizedCertifications: string[];
  missingSkillsForRoleDelta: number | null;
  summary: string;
}
