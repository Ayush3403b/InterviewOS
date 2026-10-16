/**
 * Deterministic, rule-based analysis derived from the raw entries an
 * IResumeAgent already extracts (experience/education/projects/
 * certifications/extractedSkills) - regardless of whether that agent
 * was the LLM-backed one or the Mock fallback. Computed once, in
 * `deriveResumeInsights.ts`, and merged into what gets persisted -
 * neither agent needs to know about this layer.
 */

export type SeniorityLevel = "entry" | "mid" | "senior" | "lead";

export interface EmploymentGap {
  /** The calendar year the gap starts right after (previous role's end year). */
  afterYear: number;
  /** The calendar year the gap ends right before (next role's start year). */
  beforeYear: number;
  gapYears: number;
}

export interface ExperienceAnalysis {
  /**
   * Career span in years - from the earliest role's start year to the
   * latest role's end year (or the current year, for an ongoing
   * role). This is a *span*, not a sum of each role's length, so
   * concurrent/overlapping roles (common with freelance work) don't
   * get double-counted.
   */
  totalYearsExperience: number;
  seniorityLevel: SeniorityLevel;
  /** Mean length, in years, of each individual role. */
  averageTenureYears: number;
  /** Gaps of 1+ year between the end of one role and the start of the next. */
  employmentGaps: EmploymentGap[];
  /** How many experience entries had a parseable date range. */
  entriesWithParsedDates: number;
}

export type DegreeLevel = "unknown" | "bachelor" | "master" | "phd";

export interface EducationAnalysis {
  highestDegreeLevel: DegreeLevel;
  degreeCount: number;
}

export interface ProjectAnalysis {
  totalProjects: number;
  /** Whether any project's name/description mentions a measurable outcome. */
  hasQuantifiedImpact: boolean;
  /** Distinct technologies across all projects, case-insensitively deduped. */
  distinctTechnologiesUsed: number;
  /** 0-100 heuristic score - see deriveResumeInsights.ts for the formula. */
  complexityScore: number;
}

export interface CertificationAnalysis {
  totalCertifications: number;
  /** Subset that matched a known industry-recognized credential keyword. */
  recognizedCertifications: string[];
  recommendation: string;
}

export interface SkillsGapAnalysis {
  /** Best-matching role family inferred from extractedSkills, or null
   *  if nothing in the resume overlaps any known profile. */
  inferredRoleFamily: string | null;
  matchedSkillsForRole: string[];
  missingSkillsForRole: string[];
}

export interface ResumeInsights {
  experienceAnalysis: ExperienceAnalysis;
  educationAnalysis: EducationAnalysis;
  projectAnalysis: ProjectAnalysis;
  certificationAnalysis: CertificationAnalysis;
  skillsGapAnalysis: SkillsGapAnalysis;
}
