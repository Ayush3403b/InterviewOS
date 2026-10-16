export type ResumeStatus = "PROCESSING" | "PARSED" | "FAILED";

export interface ExperienceEntryDto {
  title: string;
  company: string;
  duration: string;
  highlights: string[];
}

export interface EducationEntryDto {
  degree: string;
  institution: string;
  year: string;
}

export interface ProjectEntryDto {
  name: string;
  description: string;
  technologies: string[];
}

export interface ResumeDto {
  id: string;
  candidateId: string;
  fileName: string;
  fileUrl?: string;
  status: ResumeStatus;
  summary?: string;
  extractedSkills: string[];
  atsScore?: number;
  suggestions: string[];
  experience: ExperienceEntryDto[];
  education: EducationEntryDto[];
  projects: ProjectEntryDto[];
  certifications: string[];
  missingSkills: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface UpdateResumeDto {
  summary?: string;
  extractedSkills?: string[];
  experience?: ExperienceEntryDto[];
  education?: EducationEntryDto[];
  projects?: ProjectEntryDto[];
  certifications?: string[];
}

export interface GitHubImportDto {
  username: string;
  githubToken?: string;
  maxRepos?: number;
}

export interface LinkedInImportDto {
  profileData?: string;
  rawText?: string;
}

export interface SocialProfileSyncResult {
  source: "github" | "linkedin";
  profileName: string;
  username?: string;
  bio?: string;
  extractedSkills: string[];
  repositories?: {
    name: string;
    description: string;
    language: string;
    stars: number;
    url: string;
    topics: string[];
  }[];
  experience?: ExperienceEntryDto[];
  education?: EducationEntryDto[];
}
