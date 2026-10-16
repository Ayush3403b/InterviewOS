import { ApiError } from "../../../shared/errors/ApiError";
import { ErrorCode } from "../../../shared/errors/ErrorCode";

import { safeExtractJson } from "../../llm/jsonCleaner";
import { resumeResponseSchema } from "../schemas/resumeResponseSchema";
import { ResumeAnalysis } from "../IResumeAgent";

function extractJson(raw: string): unknown {
  try {
    return safeExtractJson(raw);
  } catch {
    throw new ApiError(
      502,
      "AI resume analysis response was not valid JSON.",
      ErrorCode.INTERNAL_SERVER_ERROR
    );
  }
}

export function parseResumeResponse(raw: string): ResumeAnalysis {
  const json = extractJson(raw);

  const result = resumeResponseSchema.safeParse(json);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");

    throw new ApiError(
      502,
      `AI resume analysis response failed validation: ${issues}`,
      ErrorCode.INTERNAL_SERVER_ERROR
    );
  }

  return result.data;
}
