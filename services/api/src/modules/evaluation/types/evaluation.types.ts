import { Document, Types } from "mongoose";

/* -------------------------------------------------------------------------- */
/*                             Evaluation Status                              */
/* -------------------------------------------------------------------------- */

export enum EvaluationStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  PUBLISHED = "PUBLISHED",
}

/* -------------------------------------------------------------------------- */
/*                              Evaluation Scores                             */
/* -------------------------------------------------------------------------- */

export interface EvaluationScores {
  communication: number;
  technical: number;
  problemSolving: number;
  confidence: number;
}

/* -------------------------------------------------------------------------- */
/*                           Evaluation Document                              */
/* -------------------------------------------------------------------------- */

export interface EvaluationDocument extends Document {
  /**
   * Related Interview Session
   */
  interviewSessionId: Types.ObjectId;

  /**
   * Organization
   */
  organizationId: Types.ObjectId;

  /**
   * Candidate
   */
  candidateId: Types.ObjectId;

  /**
   * Current Evaluation Status
   */
  status: EvaluationStatus;

  /**
   * Final Overall Score (0-100)
   */
  overallScore: number;

  /**
   * Category-wise Scores
   */
  scores: EvaluationScores;

  /**
   * AI Generated Overall Feedback
   */
  feedback: string;

  /**
   * AI Provider
   */
  provider: string;

  /**
   * LLM Model Name
   */
  llmModel: string;

  /**
   * Tokens Consumed During Evaluation
   */
  tokensUsed: number;

  /**
   * Evaluation Duration (milliseconds)
   */
  evaluationTime: number;

  /**
   * Provider-specific Metadata
   */
  metadata: Record<string, unknown>;

  /**
   * Evaluation Published Time
   */
  publishedAt?: Date | null;

  /**
   * Automatic Timestamps
   */
  createdAt: Date;

  updatedAt: Date;
}