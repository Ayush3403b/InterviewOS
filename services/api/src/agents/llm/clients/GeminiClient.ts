import { ILLMClient, LLMGenerateOptions, LLMGenerateResult } from "../ILLMClient";
import { withRetry, RetryOptions } from "../withRetry";
import { recordAiCall } from "../telemetry";

import { ApiError } from "../../../shared/errors/ApiError";
import { ErrorCode } from "../../../shared/errors/ErrorCode";

const GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

export interface GeminiClientConfig {
  apiKey: string;
  model: string;
  retry: RetryOptions;
}

export class GeminiClient implements ILLMClient {
  public readonly provider = "gemini";

  constructor(private readonly config: GeminiClientConfig) {}

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
    const url = `${GEMINI_BASE_URL}/${this.config.model}:generateContent?key=${this.config.apiKey}`;

    const startedAt = Date.now();

    let response: Response;

    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: options.system }] },
          contents: [
            {
              role: "user",
              parts: [
                ...(options.attachments ?? []).map((attachment) => ({
                  inlineData: {
                    mimeType: attachment.mimeType,
                    data: attachment.base64,
                  },
                })),
                { text: options.prompt },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            maxOutputTokens: options.maxTokens,
          },
        }),
      });
    } catch {
      throw new ApiError(
        502,
        "Failed to reach Gemini.",
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }

    const latencyMs = Date.now() - startedAt;

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");

      throw new ApiError(
        502,
        `Gemini request failed (${response.status}): ${errorBody}`,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }

    const data = (await response.json()) as {
      candidates: { content: { parts: { text?: string }[] } }[];
      usageMetadata?: { totalTokenCount: number };
    };

    const text = data.candidates[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("");

    if (!text) {
      throw new ApiError(
        502,
        "Gemini returned an empty response.",
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }

    recordAiCall({
      provider: this.provider,
      model: this.config.model,
      latencyMs,
      tokensUsed: data.usageMetadata?.totalTokenCount,
      attempt,
      success: true,
    });

    return {
      text,
      provider: this.provider,
      model: this.config.model,
      latencyMs,
      tokensUsed: data.usageMetadata?.totalTokenCount,
    };
  }
}
