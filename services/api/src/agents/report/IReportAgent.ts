export interface ReportNarrativeInput {
  candidateName: string;
  interviewTitle: string;
  interviewType: string;
  interviewLevel: string;
  overallScore: number;
  hiringRecommendation: string;
  strengths: string[];
  weaknesses: string[];
  weakTopics: string[];
}

export interface ReportNarrative {
  /** 2-4 sentence executive summary suitable for a recruiter skimming the report. */
  executiveSummary: string;
  /**
   * Warm, growth-oriented feedback written directly to the candidate.
   * Should acknowledge what they did well before moving to areas for improvement.
   */
  candidateFeedback: string;
  /**
   * Terse 2-3 sentence hiring signal for a recruiter — lead with the recommendation,
   * support with the strongest evidence, close with any key risk.
   */
  recruiterBrief: string;
  /**
   * One-paragraph digest for an executive or hiring manager with no interview context.
   * No jargon. Focus on hiring signal and business fit.
   */
  executiveDigest: string;
}

export interface IReportAgent {
  generateNarrative(input: ReportNarrativeInput): Promise<ReportNarrative>;
}
