import { logger } from "../../shared/logger/logger";

export interface AiCallTelemetry {
  provider: string;
  model: string;
  latencyMs: number;
  tokensUsed?: number;
  attempt: number;
  success: boolean;
  errorMessage?: string;
}

/**
 * Single place every LLM call is recorded from. Currently logs through
 * the shared logger; swapping this for a metrics backend (e.g.
 * Prometheus, a DB collection) later only means changing this file.
 */
export function recordAiCall(event: AiCallTelemetry): void {
  const summary = `[ai] provider=${event.provider} model=${event.model} attempt=${event.attempt} latencyMs=${event.latencyMs}${
    event.tokensUsed !== undefined ? ` tokens=${event.tokensUsed}` : ""
  }`;

  if (event.success) {
    logger.info(summary);
    return;
  }

  logger.error(`${summary} FAILED: ${event.errorMessage ?? "unknown error"}`);
}
