import { ApiError } from "../../../shared/errors/ApiError";
import { ErrorCode } from "../../../shared/errors/ErrorCode";

import { CompleteEvaluationDto } from "../../../modules/evaluation/dtos/CompleteEvaluation.dto";

import { evaluationResponseSchema } from "../schemas/evaluationResponseSchema";
import { EVALUATION_PROMPT_VERSION } from "./buildEvaluationPrompt";
import { safeExtractJson } from "../../llm/jsonCleaner";

/**
 * Strips markdown code fences some models wrap JSON in, then parses it.
 */
function extractJson(raw: string): unknown {
  try {
    return safeExtractJson(raw);
  } catch {
    throw new ApiError(
      502,
      "AI evaluation response was not valid JSON.",
      ErrorCode.INTERNAL_SERVER_ERROR
    );
  }
}

export interface ProviderMetadata {
  provider: string;
  model: string;
  latencyMs: number;
  tokensUsed?: number;
}

/**
 * Validates a provider's raw text reply against evaluationResponseSchema
 * and, only if it passes, maps it into the CompleteEvaluationDto shape
 * the rest of the app relies on.
 *
 * Unlike the old defensive parser, this throws (rather than silently
 * defaulting) when the model's output doesn't match the schema - the
 * caller (LLMEvaluationAgent) is expected to retry the generate+validate
 * cycle a bounded number of times on that failure.
 */
export function parseEvaluationResponse(
  raw: string,
  metadata: ProviderMetadata
): CompleteEvaluationDto {
  const json = extractJson(raw);

  const result = evaluationResponseSchema.safeParse(json);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");

    throw new ApiError(
      502,
      `AI evaluation response failed validation: ${issues}`,
      ErrorCode.INTERNAL_SERVER_ERROR
    );
  }

  const validated = result.data;

  return {
    overallScore: validated.overallScore,
    skillScores: validated.skillScores,
    strengths: validated.strengths,
    weaknesses: validated.weaknesses,
    recommendations: validated.recommendations,
    overallSummary: validated.overallSummary,
    hiringRecommendation: validated.hiringRecommendation,
    questionEvaluations: validated.questionEvaluations,
    skillGaps: validated.skillGaps,
    metadata: {
      provider: metadata.provider,
      model: metadata.model,
      promptVersion: EVALUATION_PROMPT_VERSION,
      latencyMs: metadata.latencyMs,
      tokensUsed: metadata.tokensUsed ?? 0,
    },
  };
}
