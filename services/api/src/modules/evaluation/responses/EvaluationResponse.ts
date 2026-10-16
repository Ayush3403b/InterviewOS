import {
  EvaluationStatus,
  HiringRecommendation,
  QuestionEvaluation,
  SkillScores,
} from "../types/evaluation.types";

export interface EvaluationResponse {
  id: string;

  interviewSessionId: string;

  organizationId?: string;

  candidateId: string;

  status: EvaluationStatus;

  overallScore: number;

  skillScores: SkillScores;

  strengths: string[];

  weaknesses: string[];

  recommendations: string[];

  overallSummary: string;

  hiringRecommendation: HiringRecommendation;

  questionEvaluations: QuestionEvaluation[];

  publishedAt?: Date;

  createdAt: Date;

  updatedAt: Date;
}