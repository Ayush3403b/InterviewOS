import {
  ILLMClient,
  LLMGenerateOptions,
  LLMGenerateResult,
} from "./ILLMClient";
import { estimateCostUsd } from "./costEstimate";
import type { RecordAiCallInput } from "../../modules/ai-usage/types/ai-usage.types";

/**
 * The minimal shape PersistingLLMClient needs to persist a call.
 * Mirrors modules/ai-usage's RecordAiCallInput exactly (imported as a
 * type-only import, so this stays a type-level dependency only - no
 * runtime coupling between agents/ and modules/).
 */
export interface AiUsageRecorder {
  record(entry: RecordAiCallInput): void | Promise<void>;
}

/**
 * Wraps any ILLMClient and records every call (success or failure) via
 * the injected recorder - this is the "AI Cost Tracking" layer.
 * Composable with FallbackLLMClient in either order; wrapping the
 * fallback chain records one row per actual provider attempt made
 * inside it isn't possible from the outside, so in practice this
 * wraps each individual provider client, and FallbackLLMClient wraps
 * those - see container/index.ts.
 */
export class PersistingLLMClient implements ILLMClient {
  public readonly provider: string;

  constructor(
    private readonly inner: ILLMClient,
    private readonly recorder: AiUsageRecorder
  ) {
    this.provider = inner.provider;
  }

  async generate(options: LLMGenerateOptions): Promise<LLMGenerateResult> {
    const promptId = options.promptId ?? "unknown";
    const promptVersion = options.promptVersion ?? "unknown";

    try {
      const result = await this.inner.generate(options);

      void this.recorder.record({
        provider: result.provider,
        modelName: result.model,
        promptId,
        promptVersion,
        tokensUsed: result.tokensUsed,
        estimatedCostUsd: estimateCostUsd(result.provider, result.tokensUsed),
        latencyMs: result.latencyMs,
        success: true,
        interviewSessionId: options.interviewSessionId,
        userId: options.userId,
      });

      return result;
    } catch (error) {
      void this.recorder.record({
        provider: this.inner.provider,
        modelName: "unknown",
        promptId,
        promptVersion,
        latencyMs: 0,
        success: false,
        errorMessage: error instanceof Error ? error.message : String(error),
        interviewSessionId: options.interviewSessionId,
        userId: options.userId,
      });

      throw error;
    }
  }
}
