import { ApiError } from "../../../shared/errors/ApiError";
import { ErrorCode } from "../../../shared/errors/ErrorCode";

import { safeExtractJson } from "../../llm/jsonCleaner";
import { conversationSummarySchema } from "../schemas/conversationSummarySchema";
import { ConversationSummaryResult } from "../IConversationAgent";

function extractJson(raw: string): unknown {
  try {
    return safeExtractJson(raw);
  } catch {
    throw new ApiError(
      502,
      "AI conversation-summary response was not valid JSON.",
      ErrorCode.INTERNAL_SERVER_ERROR
    );
  }
}

export function parseConversationSummaryResponse(
  raw: string
): ConversationSummaryResult {
  const json = extractJson(raw);
  const result = conversationSummarySchema.safeParse(json);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");

    throw new ApiError(
      502,
      `AI conversation-summary response failed validation: ${issues}`,
      ErrorCode.INTERNAL_SERVER_ERROR
    );
  }

  return result.data;
}
