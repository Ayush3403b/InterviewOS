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

export interface ResumeAnalysis {
  /** Short summary suitable for feeding into interview-context.resumeSummary. */
  summary: string;

  extractedSkills: string[];

  /** 0-100 ATS-style compatibility score. */
  atsScore: number;

  suggestions: string[];

  experience: ExperienceEntry[];

  education: EducationEntry[];

  projects: ProjectEntry[];

  certifications: string[];

  /** Commonly expected skills the resume doesn't demonstrate. */
  missingSkills: string[];
}

export interface IResumeAgent {
  analyze(rawText: string): Promise<ResumeAnalysis>;
}
