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
  /** The specific snippet the issue applies to, when identifiable. */
  excerpt?: string;
  message: string;
  suggestion?: string;
}

export interface GrammarCheckResult {
  /** 0-100, purely a rough "how clean is this" indicator - not the
   *  same axis as the resume's ATS score. */
  score: number;
  issues: GrammarIssue[];
}

export interface RewriteOptions {
  /** e.g. "senior backend engineer" - helps tailor tone/vocabulary. */
  targetRole?: string;
}

export interface RewriteResult {
  original: string;
  rewritten: string;
  /** 1-3 sentences on what changed and why. */
  explanation: string;
}

export interface JDMatchOptions {
  targetRole?: string;
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

import type {
  GenerateResumeRequestDto,
  GeneratedResumeResultDto,
  AiOptimizeResumeResultDto,
} from "@interviewos/types";

export interface IResumeWriterAgent {
  checkGrammar(text: string): Promise<GrammarCheckResult>;
  rewrite(text: string, options?: RewriteOptions): Promise<RewriteResult>;
  matchJobDescription(
    resumeText: string,
    jobDescription: string,
    options?: JDMatchOptions
  ): Promise<JDMatchResult>;
  generateResume(options: GenerateResumeRequestDto): Promise<GeneratedResumeResultDto>;
  optimizeResume(
    resumeData: {
      summary?: string;
      rawText?: string;
      extractedSkills?: string[];
      experience?: any[];
      projects?: any[];
      education?: any[];
      certifications?: string[];
    },
    jobDescription?: string,
    targetRole?: string
  ): Promise<AiOptimizeResumeResultDto>;
}
