import { Document, Types } from "mongoose";

export enum EvaluationStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  PUBLISHED = "PUBLISHED",
}

export enum HiringRecommendation {
  STRONG_HIRE = "STRONG_HIRE",
  HIRE = "HIRE",
  BORDERLINE = "BORDERLINE",
  NO_HIRE = "NO_HIRE",
}

export interface SkillScores {
  technical: number;
  communication: number;
  problemSolving: number;
  confidence: number;
}

export interface QuestionEvaluation {
  turnNumber: number;
  question: string;
  answer: string;
  score: number;
  feedback: string;
}

export interface EvaluationMetadata {
  provider?: string;
  model?: string;
  promptVersion?: string;
  latencyMs?: number;
  tokensUsed?: number;
}

export interface EvaluationDocument extends Document {
  interviewSessionId: Types.ObjectId;

  organizationId: Types.ObjectId;

  candidateId: Types.ObjectId;

  status: EvaluationStatus;

  overallScore: number;

  skillScores: SkillScores;

  strengths: string[];

  weaknesses: string[];

  recommendations: string[];

  overallSummary: string;

  hiringRecommendation: HiringRecommendation;

  questionEvaluations: QuestionEvaluation[];

  metadata: EvaluationMetadata;

  publishedAt?: Date;

  createdAt: Date;

  updatedAt: Date;
}