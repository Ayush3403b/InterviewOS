import { EvaluationStatus } from "../types/evaluation.types";

export interface UpdateEvaluationDto {
  status?: EvaluationStatus;

  overallScore?: number;

  scores?: {
    communication?: number;
    technical?: number;
    problemSolving?: number;
    confidence?: number;
  };

  feedback?: string;

  provider?: string;

  llmModel?: string;

  tokensUsed?: number;

  evaluationTime?: number;

  metadata?: Record<string, unknown>;

  publishedAt?: Date;
}