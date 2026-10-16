import { ApiError } from "../../../shared/errors/ApiError";
import { ErrorCode } from "../../../shared/errors/ErrorCode";

import { safeExtractJson } from "../../llm/jsonCleaner";
import { jdMatchResponseSchema } from "../schemas/jdMatchResponseSchema";
import { JDMatchResult } from "../IResumeWriterAgent";

function extractJson(raw: string): unknown {
  try {
    return safeExtractJson(raw);
  } catch {
    throw new ApiError(
      502,
      "AI JD Match response was not valid JSON.",
      ErrorCode.INTERNAL_SERVER_ERROR
    );
  }
}

export function parseJDMatchResponse(raw: string): JDMatchResult {
  const json = extractJson(raw);

  const result = jdMatchResponseSchema.safeParse(json);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");

    throw new ApiError(
      502,
      `AI JD Match response failed validation: ${issues}`,
      ErrorCode.INTERNAL_SERVER_ERROR
    );
  }

  return result.data;
}
