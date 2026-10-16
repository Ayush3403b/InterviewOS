import { ApiError } from "../../../shared/errors/ApiError";
import { ErrorCode } from "../../../shared/errors/ErrorCode";

import { safeExtractJson } from "../../llm/jsonCleaner";
import { generatedMcqSchema, mcqEnvelopeSchema } from "../schemas/mcqResponseSchema";
import { GeneratedMcq } from "../IMcqAgent";

export interface ParsedMcqResponse {
  mode?: "EXTRACTED" | "GENERATED";
  questions: GeneratedMcq[];
  /** Questions the model returned that failed validation and were skipped. */
  droppedCount: number;
}

function extractJson(raw: string): unknown {
  try {
    return safeExtractJson(raw);
  } catch {
    throw new ApiError(
      502,
      "AI MCQ response was not valid JSON.",
      ErrorCode.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * Validates question by question: a batch of 20 with one bad answer
 * index keeps the other 19. Only a malformed envelope, or a non-empty
 * batch where *nothing* is usable, counts as a failed response (and is
 * retried by the agent).
 */
export function parseMcqResponse(raw: string): ParsedMcqResponse {
  const json = extractJson(raw);

  // Some models skip the envelope and return the array on its own.
  const envelope = mcqEnvelopeSchema.safeParse(
    Array.isArray(json) ? { questions: json } : json
  );

  if (!envelope.success) {
    const issues = envelope.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");

    throw new ApiError(
      502,
      `AI MCQ response failed validation: ${issues}`,
      ErrorCode.INTERNAL_SERVER_ERROR
    );
  }

  const questions: GeneratedMcq[] = [];

  for (const candidate of envelope.data.questions) {
    const result = generatedMcqSchema.safeParse(candidate);

    if (result.success) {
      questions.push(result.data);
    }
  }

  const droppedCount = envelope.data.questions.length - questions.length;

  if (envelope.data.questions.length > 0 && questions.length === 0) {
    throw new ApiError(
      502,
      "None of the AI-generated questions passed validation.",
      ErrorCode.INTERNAL_SERVER_ERROR
    );
  }

  return { mode: envelope.data.mode, questions, droppedCount };
}
