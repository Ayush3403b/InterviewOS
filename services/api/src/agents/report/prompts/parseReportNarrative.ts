import { ApiError } from "../../../shared/errors/ApiError";
import { ErrorCode } from "../../../shared/errors/ErrorCode";

import { safeExtractJson } from "../../llm/jsonCleaner";
import { reportNarrativeSchema } from "../schemas/reportNarrativeSchema";
import { ReportNarrative } from "../IReportAgent";

function extractJson(raw: string): unknown {
  try {
    return safeExtractJson(raw);
  } catch {
    throw new ApiError(
      502,
      "AI report narrative response was not valid JSON.",
      ErrorCode.INTERNAL_SERVER_ERROR
    );
  }
}

export function parseReportNarrative(raw: string): ReportNarrative {
  const json = extractJson(raw);

  const result = reportNarrativeSchema.safeParse(json);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");

    throw new ApiError(
      502,
      `AI report narrative response failed validation: ${issues}`,
      ErrorCode.INTERNAL_SERVER_ERROR
    );
  }

  return result.data;
}
