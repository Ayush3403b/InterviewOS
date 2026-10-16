import { ZodType, z } from "zod";

import { ApiError } from "../../../shared/errors/ApiError";
import { ErrorCode } from "../../../shared/errors/ErrorCode";

/**
 * Parses a request body, throwing a 400 whose message is the first
 * problem found (e.g. "At most 6 options.") so the client can show it
 * as-is.
 */
export function parseBody<T extends ZodType>(schema: T, body: unknown): z.output<T> {
  const result = schema.safeParse(body ?? {});

  if (!result.success) {
    const issue = result.error.issues[0];
    const where = issue.path.length ? ` (${issue.path.join(".")})` : "";

    throw new ApiError(
      400,
      `${issue.message}${where}`,
      ErrorCode.VALIDATION_ERROR
    );
  }

  return result.data;
}
