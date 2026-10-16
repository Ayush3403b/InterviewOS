import { Document, Types } from "mongoose";

/* -------------------------------------------------------------------------- */
/*                                    Enums                                    */
/* -------------------------------------------------------------------------- */

/**
 * DRAFT     - being built; questions and settings are editable, nobody
 *             can take it.
 * PUBLISHED - locked, open to anyone with the access code.
 * CLOSED    - no new attempts; results stay reviewable. Can be reopened.
 */
export enum McqTestStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  CLOSED = "CLOSED",
}

export enum McqDifficulty {
  EASY = "EASY",
  MEDIUM = "MEDIUM",
  HARD = "HARD",
}

export enum McqQuestionSource {
  MANUAL = "MANUAL",
  AI_TOPICS = "AI_TOPICS",
  AI_MATERIAL = "AI_MATERIAL",
}

export enum McqAttemptStatus {
  IN_PROGRESS = "IN_PROGRESS",
  SUBMITTED = "SUBMITTED",
}

export enum McqSubmitReason {
  /** The candidate pressed submit. */
  MANUAL = "MANUAL",
  /** The deadline passed - submitted by the client timer or lazily by the server. */
  TIME_UP = "TIME_UP",
  /** Auto-submitted by the test room after repeated fullscreen exits. */
  PROCTORING = "PROCTORING",
}

/* -------------------------------------------------------------------------- */
/*                                    Limits                                   */
/* -------------------------------------------------------------------------- */

export const MCQ_LIMITS = {
  maxQuestionsPerTest: 200,
  minOptions: 2,
  maxOptions: 6,
  questionMaxLength: 2000,
  optionMaxLength: 500,
  explanationMaxLength: 2000,
  maxPoints: 10,
  minDurationMinutes: 1,
  maxDurationMinutes: 300,
  /** Per generation request - see LLMMcqAgent's MAX_OUTPUT_TOKENS. */
  maxGeneratedPerRequest: 25,
} as const;

/* -------------------------------------------------------------------------- */
/*                                     Test                                    */
/* -------------------------------------------------------------------------- */

export interface McqQuestion {
  _id: Types.ObjectId;

  text: string;

  options: string[];

  /** 0-based index into `options`. Never sent to candidates. */
  correctOptionIndex: number;

  explanation?: string;

  topic?: string;

  difficulty: McqDifficulty;

  points: number;

  source: McqQuestionSource;
}

export interface McqTest {
  title: string;

  description?: string;

  /** Shown to candidates before they start. */
  instructions?: string;

  createdBy: Types.ObjectId;

  /** The creator's organization at creation time, if any. */
  organizationId?: Types.ObjectId;

  status: McqTestStatus;

  durationMinutes: number;

  /** 0-100 - an attempt passes at or above this percentage. */
  passPercentage: number;

  shuffleQuestions: boolean;

  shuffleOptions: boolean;

  /** Whether candidates see their score after submitting. They never see the answer key. */
  showScoreToCandidate: boolean;

  /** Set on first publish, kept across close/reopen. */
  accessCode?: string;

  questions: McqQuestion[];

  publishedAt?: Date;

  closedAt?: Date;

  createdAt: Date;

  updatedAt: Date;
}

export interface McqTestDocument extends McqTest, Document<Types.ObjectId> {}

/* -------------------------------------------------------------------------- */
/*                                    Attempt                                  */
/* -------------------------------------------------------------------------- */

/**
 * A copy of the question as it was when the attempt started, in the
 * order this candidate sees it. Scoring only ever reads these, so later
 * edits to the test (after reverting it to draft) can't change a
 * submitted result.
 */
export interface McqAttemptQuestion {
  questionId: Types.ObjectId;

  text: string;

  options: string[];

  correctOptionIndex: number;

  /** Display order for this candidate - indices into `options`. */
  optionOrder: number[];

  points: number;

  topic?: string;

  explanation?: string;
}

export interface McqAttemptResult {
  score: number;

  maxScore: number;

  /** 0-100, one decimal place. */
  percentage: number;

  passed: boolean;

  correctCount: number;

  answeredCount: number;
}

export interface McqAttempt {
  testId: Types.ObjectId;

  candidateId: Types.ObjectId;

  organizationId?: Types.ObjectId;

  status: McqAttemptStatus;

  startedAt: Date;

  /** startedAt + the test's duration. Answers are accepted up to this plus a short grace period. */
  deadlineAt: Date;

  submittedAt?: Date;

  submitReason?: McqSubmitReason;

  /** Snapshotted from the test at start time. */
  testTitle: string;

  passPercentage: number;

  showScoreToCandidate: boolean;

  questions: McqAttemptQuestion[];

  /** questionId -> selected option index (into the question's original `options`). */
  answers: Map<string, number>;

  result?: McqAttemptResult;

  createdAt: Date;

  updatedAt: Date;
}

export interface McqAttemptDocument extends McqAttempt, Document<Types.ObjectId> {}
