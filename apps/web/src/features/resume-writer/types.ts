export type GrammarIssueType =
  | "passive_voice"
  | "weak_opener"
  | "no_quantification"
  | "personal_pronoun"
  | "repeated_word"
  | "sentence_too_long"
  | "other";

export interface GrammarIssue {
  type: GrammarIssueType;
  excerpt?: string;
  message: string;
  suggestion?: string;
}

export interface GrammarCheckResult {
  score: number;
  issues: GrammarIssue[];
}

export interface RewriteResult {
  original: string;
  rewritten: string;
  explanation: string;
}

export interface TailoredBulletPoint {
  originalBullet?: string;
  tailoredBullet: string;
  highlightedKeywords: string[];
  rationale: string;
}

export interface JDMatchResult {
  matchScore: number;
  targetRole: string;
  matchingKeywords: string[];
  missingKeywords: string[];
  tailoredSummary: string;
  tailoredBulletPoints: TailoredBulletPoint[];
  recommendations: string[];
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
  experience?: Array<{
    title: string;
    company: string;
    duration: string;
    location?: string;
    bullets: string[];
  }>;
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
