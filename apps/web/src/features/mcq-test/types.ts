import type { ProctoringSessionState, RiskLevel } from "../proctoring/reportTypes";

/*
 * Mirrors services/api/src/modules/mcq-test (McqTestResponse.ts).
 * Plain union types, no enums - this project runs `erasableSyntaxOnly`.
 */

export type McqTestStatus = "DRAFT" | "PUBLISHED" | "CLOSED";

export type McqDifficulty = "EASY" | "MEDIUM" | "HARD";

export type McqDifficultyChoice = McqDifficulty | "MIXED";

export type McqQuestionSource = "MANUAL" | "AI_TOPICS" | "AI_MATERIAL";

export type McqMaterialMode = "AUTO" | "EXTRACT" | "GENERATE";

export type McqAttemptStatus = "IN_PROGRESS" | "SUBMITTED";

export type McqSubmitReason = "MANUAL" | "TIME_UP" | "PROCTORING";

/* -------------------------------------------------------------------------- */
/*                                   Author                                    */
/* -------------------------------------------------------------------------- */

/** Mirrors McqTestResponse.toTestSummary. */
export interface McqTestSummary {
  id: string;
  title: string;
  status: McqTestStatus;
  durationMinutes: number;
  questionCount: number;
  totalPoints: number;
  accessCode: string | null;
  attemptCount: number;
  submittedCount: number;
  publishedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface McqQuestion {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  topic: string;
  difficulty: McqDifficulty;
  points: number;
  source: McqQuestionSource;
}

/** Mirrors McqTestResponse.toTestDetail - includes the answer key. */
export interface McqTestDetail extends McqTestSummary {
  description: string;
  instructions: string;
  passPercentage: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showScoreToCandidate: boolean;
  questions: McqQuestion[];
}

export interface McqTestSettingsPayload {
  title: string;
  description?: string;
  instructions?: string;
  durationMinutes: number;
  passPercentage?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  showScoreToCandidate?: boolean;
}

/** A question as the editor sends it - `id` only for ones that already exist. */
export interface McqQuestionInput {
  id?: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
  topic?: string;
  difficulty?: McqDifficulty;
  points?: number;
}

export interface GenerateFromTopicsPayload {
  topics: string;
  count: number;
  difficulty: McqDifficultyChoice;
  instructions?: string;
}

export interface ImportFromFilesPayload {
  files: File[];
  count: number;
  difficulty: McqDifficultyChoice;
  mode: McqMaterialMode;
  instructions?: string;
}

export interface GenerationResult {
  test: McqTestDetail;
  addedCount: number;
  /** Uploads only: whether the AI copied existing questions or wrote new ones. */
  mode: "EXTRACTED" | "GENERATED" | null;
  /** Uploads only: the PDF text was too long and got cut. */
  truncated: boolean;
}

export interface McqAttemptResult {
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  correctCount: number;
  answeredCount: number;
}

export interface McqCandidateRef {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
}

/** Mirrors McqTestResponse.toResultRow. */
export interface McqResultRow {
  id: string;
  candidate: McqCandidateRef;
  status: McqAttemptStatus;
  startedAt: string;
  deadlineAt: string;
  submittedAt: string | null;
  submitReason: McqSubmitReason | null;
  result: McqAttemptResult | null;
  proctoring: {
    status: ProctoringSessionState;
    trustScore: number;
    riskScore: number;
    riskLevel: RiskLevel;
  } | null;
}

export interface McqTestResults {
  test: {
    id: string;
    title: string;
    status: McqTestStatus;
    passPercentage: number;
    questionCount: number;
  };
  attempts: McqResultRow[];
}

/** Mirrors McqTestResponse.toAttemptReview. */
export interface McqAttemptReview extends McqResultRow {
  testId: string;
  testTitle: string;
  passPercentage: number;
  questions: {
    number: number;
    questionId: string;
    text: string;
    options: string[];
    correctOptionIndex: number;
    selectedOptionIndex: number | null;
    isCorrect: boolean;
    points: number;
    topic: string;
    explanation: string;
  }[];
}

/* -------------------------------------------------------------------------- */
/*                                  Candidate                                  */
/* -------------------------------------------------------------------------- */

/** Mirrors McqTestResponse.toTestPreview. */
export interface McqTestPreview {
  title: string;
  description: string;
  instructions: string;
  durationMinutes: number;
  questionCount: number;
  acceptingAttempts: boolean;
  myAttempt: { id: string; status: McqAttemptStatus } | null;
}

export interface McqCandidateQuestion {
  id: string;
  text: string;
  points: number;
  /** In this candidate's display order; `index` is what gets submitted. */
  options: { index: number; text: string }[];
}

/** Mirrors McqTestResponse.toCandidateAttempt. */
export interface McqCandidateAttempt {
  id: string;
  testTitle: string;
  status: McqAttemptStatus;
  startedAt: string;
  deadlineAt: string;
  /** The server's clock when this was sent - for a skew-free countdown. */
  serverNow: string;
  submittedAt: string | null;
  submitReason: McqSubmitReason | null;
  questionCount: number;
  questions: McqCandidateQuestion[];
  /** questionId -> selected option index. */
  answers: Record<string, number>;
  /** Null while in progress, or when the author hides scores. */
  result: McqAttemptResult | null;
}

/** Mirrors McqTestResponse.toMyAttemptSummary. */
export interface McqMyAttempt {
  id: string;
  testTitle: string;
  status: McqAttemptStatus;
  startedAt: string;
  deadlineAt: string;
  submittedAt: string | null;
  result: McqAttemptResult | null;
}
