import {
  EvaluationMetadata,
  HiringRecommendation,
  QuestionEvaluation,
  SkillGap,
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

  skillGaps: SkillGap[];

  metadata: EvaluationMetadata;
}