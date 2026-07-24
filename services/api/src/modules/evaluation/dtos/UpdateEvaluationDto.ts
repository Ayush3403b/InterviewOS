import {
  HiringRecommendation,
  QuestionEvaluation,
  SkillScores,
  EvaluationMetadata,
} from "../types/evaluation.types";

export interface UpdateEvaluationDto {
  overallScore?: number;

  skillScores?: SkillScores;

  strengths?: string[];

  weaknesses?: string[];

  recommendations?: string[];

  overallSummary?: string;

  hiringRecommendation?: HiringRecommendation;

  questionEvaluations?: QuestionEvaluation[];

  metadata?: EvaluationMetadata;
}