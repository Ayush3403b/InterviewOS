import { EvaluationDocument } from "../types/evaluation.types";

import { EvaluationResponse } from "./EvaluationResponse";

export class EvaluationResponseMapper {
  static toResponse(
    evaluation: EvaluationDocument
  ): EvaluationResponse {
    return {
      id: evaluation.id,

      interviewSessionId:
        evaluation.interviewSessionId.toString(),

      organizationId:
        evaluation.organizationId?.toString(),

      candidateId:
        evaluation.candidateId.toString(),

      status: evaluation.status,

      overallScore: evaluation.overallScore,

      skillScores: evaluation.skillScores,

      strengths: evaluation.strengths,

      weaknesses: evaluation.weaknesses,

      recommendations: evaluation.recommendations,

      overallSummary: evaluation.overallSummary,

      hiringRecommendation:
        evaluation.hiringRecommendation,

      questionEvaluations:
        evaluation.questionEvaluations,

      publishedAt: evaluation.publishedAt,

      createdAt: evaluation.createdAt,

      updatedAt: evaluation.updatedAt,
    };
  }

  static toResponseList(
    evaluations: EvaluationDocument[]
  ): EvaluationResponse[] {
    return evaluations.map((evaluation) =>
      this.toResponse(evaluation)
    );
  }
}