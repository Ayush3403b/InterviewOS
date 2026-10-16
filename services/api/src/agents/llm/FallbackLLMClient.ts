import { ILLMClient, LLMGenerateOptions, LLMGenerateResult } from "./ILLMClient";
import { ApiError } from "../../shared/errors/ApiError";
import { ErrorCode } from "../../shared/errors/ErrorCode";
import { logger } from "../../shared/logger/logger";

/**
 * Tries each client in order (each has already retried transiently on
 * its own). Only moves to the next client once one has fully failed -
 * this is provider fallback, not a substitute for the per-provider
 * retry each ClaudeClient/OpenAIClient/GeminiClient already does.
 */
export class FallbackLLMClient implements ILLMClient {
  public readonly provider: string;

  constructor(private readonly clients: ILLMClient[]) {
    if (clients.length === 0) {
      throw new Error("FallbackLLMClient requires at least one client.");
    }

    this.provider = `fallback(${clients.map((c) => c.provider).join(" -> ")})`;
  }

  async generate(options: LLMGenerateOptions): Promise<LLMGenerateResult> {
    let lastError: unknown;

    for (const client of this.clients) {
      try {
        return await client.generate(options);
      } catch (error) {
        lastError = error;

        logger.warn(
          `AI provider "${client.provider}" failed, trying next in fallback chain.`
        );
      }
    }

    throw new ApiError(
      502,
      `All AI providers in the fallback chain failed. Last error: ${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`,
      ErrorCode.INTERNAL_SERVER_ERROR
    );
  }
}
