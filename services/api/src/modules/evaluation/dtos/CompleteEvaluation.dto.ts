import {
  EvaluationMetadata,
  HiringRecommendation,
  QuestionEvaluation,
  SkillScores,
} from "../types/evaluation.types";

export interface CompleteEvaluationDto {
  overallScore: number;

  skillScores: SkillScores;

  strengths: string[];

  weaknesses: string[];

  recommendations: string[];

  overallSummary: string;

  hiringRecommendation: HiringRecommendation;

  questionEvaluations: QuestionEvaluation[];

  metadata: EvaluationMetadata;
}