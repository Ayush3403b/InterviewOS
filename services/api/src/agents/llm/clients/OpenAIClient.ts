import { ILLMClient, LLMGenerateOptions, LLMGenerateResult } from "../ILLMClient";
import { withRetry, RetryOptions } from "../withRetry";
import { recordAiCall } from "../telemetry";

import { ApiError } from "../../../shared/errors/ApiError";
import { ErrorCode } from "../../../shared/errors/ErrorCode";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

/**
 * Plain string for text-only calls (unchanged wire format); a content
 * array when there are attachments - images as data-URL image parts,
 * PDFs as file parts.
 */
function buildUserContent(options: LLMGenerateOptions) {
  if (!options.attachments?.length) {
    return options.prompt;
  }

  return [
    ...options.attachments.map((attachment) => {
      const dataUrl = `data:${attachment.mimeType};base64,${attachment.base64}`;

      return attachment.mimeType === "application/pdf"
        ? {
            type: "file",
            file: {
              filename: attachment.filename ?? "document.pdf",
              file_data: dataUrl,
            },
          }
        : { type: "image_url", image_url: { url: dataUrl } };
    }),
    { type: "text", text: options.prompt },
  ];
}

export interface OpenAIClientConfig {
  apiKey: string;
  model: string;
  retry: RetryOptions;
}

export class OpenAIClient implements ILLMClient {
  public readonly provider = "openai";

  constructor(private readonly config: OpenAIClientConfig) {}

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
      response = await fetch(OPENAI_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          response_format: { type: "json_object" },
          max_tokens: options.maxTokens,
          messages: [
            { role: "system", content: options.system },
            { role: "user", content: buildUserContent(options) },
          ],
        }),
      });
    } catch {
      throw new ApiError(
        502,
        "Failed to reach OpenAI.",
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }

    const latencyMs = Date.now() - startedAt;

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");

      throw new ApiError(
        502,
        `OpenAI request failed (${response.status}): ${errorBody}`,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }

    const data = (await response.json()) as {
      choices: { message: { content?: string } }[];
      usage?: { total_tokens: number };
      model: string;
    };

    const text = data.choices[0]?.message?.content;

    if (!text) {
      throw new ApiError(
        502,
        "OpenAI returned an empty response.",
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }

    recordAiCall({
      provider: this.provider,
      model: data.model ?? this.config.model,
      latencyMs,
      tokensUsed: data.usage?.total_tokens,
      attempt,
      success: true,
    });

    return {
      text,
      provider: this.provider,
      model: data.model ?? this.config.model,
      latencyMs,
      tokensUsed: data.usage?.total_tokens,
    };
  }
}
