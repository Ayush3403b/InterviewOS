import { ILLMClient, LLMGenerateOptions, LLMGenerateResult } from "../ILLMClient";
import { withRetry, RetryOptions } from "../withRetry";
import { recordAiCall } from "../telemetry";

import { ApiError } from "../../../shared/errors/ApiError";
import { ErrorCode } from "../../../shared/errors/ErrorCode";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_MAX_TOKENS = 4096;

export interface ClaudeClientConfig {
  apiKey: string;
  model: string;
  retry: RetryOptions;
}

export class ClaudeClient implements ILLMClient {
  public readonly provider = "claude";

  constructor(private readonly config: ClaudeClientConfig) {}

  async generate(options: LLMGenerateOptions): Promise<LLMGenerateResult> {
    return withRetry(
      (attempt) => this.attemptGenerate(options, attempt),
      this.config.retry,
      (attempt, error) => {
        recordAiCall({
          provider: this.provider,
          model: this.config.model,
          latencyMs: 0,
          attempt,
          success: false,
          errorMessage: error instanceof Error ? error.message : String(error),
        });
      }
    );
  }

  private async attemptGenerate(
    options: LLMGenerateOptions,
    attempt: number
  ): Promise<LLMGenerateResult> {
    const startedAt = Date.now();

    let response: Response;

    try {
      response = await fetch(ANTHROPIC_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": this.config.apiKey,
          "anthropic-version": ANTHROPIC_VERSION,
        },
        body: JSON.stringify({
          model: this.config.model,
          max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
          system: options.system,
          messages: [{ role: "user", content: options.prompt }],
        }),
      });
    } catch {
      throw new ApiError(
        502,
        "Failed to reach Claude.",
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }

    const latencyMs = Date.now() - startedAt;

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");

      throw new ApiError(
        502,
        `Claude request failed (${response.status}): ${errorBody}`,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }

    const data = (await response.json()) as {
      content: { type: string; text?: string }[];
      usage?: { input_tokens: number; output_tokens: number };
      model: string;
    };

    const text = data.content.find((block) => block.type === "text")?.text;

    if (!text) {
      throw new ApiError(
        502,
        "Claude returned an empty response.",
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }

    const tokensUsed = data.usage
      ? data.usage.input_tokens + data.usage.output_tokens
      : undefined;

    recordAiCall({
      provider: this.provider,
      model: data.model ?? this.config.model,
      latencyMs,
      tokensUsed,
      attempt,
      success: true,
    });

    return {
      text,
      provider: this.provider,
      model: data.model ?? this.config.model,
      latencyMs,
      tokensUsed,
    };
  }
}
