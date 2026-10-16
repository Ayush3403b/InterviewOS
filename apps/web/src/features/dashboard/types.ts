/** Mirrors InterviewType (services/api .../interview-session.types.ts). */
export type InterviewType =
  | "TECHNICAL"
  | "CODING"
  | "HR"
  | "SYSTEM_DESIGN"
  | "BEHAVIORAL"
  | "MIXED";

/** Mirrors InterviewLevel. */
export type InterviewLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

/** Mirrors SectionName. */
export type SectionName = "intro" | "behavioral" | "technical" | "wrap-up";

/** Mirrors SectionAllocation (without the server-side questionsAsked field). */
export interface SectionAllocation {
  name: SectionName;
  maxQuestions: number;
}

/** Mirrors InterviewStatus. */
export type InterviewStatus =
  | "CREATED"
  | "IN_PROGRESS"
  | "PAUSED"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED";

/** Mirrors InterviewSessionSummaryDto (used by getMySessions/getRecentInterviews). */
export interface InterviewSessionSummary {
  id: string;
  title: string;
  type: InterviewType;
  level: InterviewLevel;
  status: InterviewStatus;
  score: number;
  duration: number;
  createdAt: string;
}

/** Mirrors InterviewSessionResponseDto (full detail, e.g. getSessionById). */
export interface InterviewSessionDetail extends InterviewSessionSummary {
  turnCount: number;
  maxQuestions: number;
  feedback: string;
  sectionPlan?: SectionAllocation[];
  startedAt: string | null;
  completedAt: string | null;
  updatedAt: string;
}

/** Mirrors InterviewStatisticsResponseDto. */
export interface InterviewStatistics {
  totalInterviews: number;
  completedInterviews: number;
  averageScore: number;
  totalDuration: number;
}

/** Mirrors CreateInterviewSessionDto. */
export interface CreateSessionPayload {
  title: string;
  type: InterviewType;
  level: InterviewLevel;
  maxQuestions?: number;
  sectionPlan?: SectionAllocation[];
  targetCompany?: string;
  targetRole?: string;
}
