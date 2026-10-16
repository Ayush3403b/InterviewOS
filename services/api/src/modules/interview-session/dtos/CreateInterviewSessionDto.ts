import {
  InterviewLevel,
  InterviewType,
  SectionAllocation,
} from "../types/interview-session.types";

export interface CreateInterviewSessionDto {
  /**
   * User-defined interview title.
   */
  title: string;

  /**
   * Interview category.
   */
  type: InterviewType;

  /**
   * Interview difficulty.
   */
  level: InterviewLevel;

  /**
   * Maximum AI conversation turns.
   * Optional because the model defaults it.
   * Ignored when sectionPlan is provided (the sum of section maxQuestions takes precedence).
   */
  maxQuestions?: number;

  /**
   * Optional structured interview plan with per-section question budgets.
   * When provided, the planner will advance through sections in order instead
   * of using a flat question count.
   */
  sectionPlan?: Omit<SectionAllocation, "questionsAsked">[];

  /** Target company name for template selection (e.g. "Google"). */
  targetCompany?: string;

  /** Target role for template selection (e.g. "Software Engineer"). */
  targetRole?: string;
}