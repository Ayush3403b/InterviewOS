import { env } from "./env";

export type LLMProviderName = "claude" | "openai" | "gemini" | "mock";

export interface ProviderCredentials {
  provider: LLMProviderName;
  apiKey: string;
  model: string;
}

function parseFallbackProviders(): Exclude<LLMProviderName, "mock">[] {
  return env.AI_FALLBACK_PROVIDERS.split(",")
    .map((entry) => entry.trim())
    .filter(
      (entry): entry is Exclude<LLMProviderName, "mock"> =>
        entry === "claude" || entry === "openai" || entry === "gemini"
    );
}

/**
 * Looks up the API key + model for a given provider. Throws clearly if
 * that provider is selected (as primary or fallback) without its key
 * configured - fails fast at startup rather than on the first request.
 */
export function getProviderCredentials(
  provider: Exclude<LLMProviderName, "mock">
): ProviderCredentials {
  switch (provider) {
    case "claude":
      if (!env.ANTHROPIC_API_KEY) {
        throw new Error(
          'Provider "claude" is configured but ANTHROPIC_API_KEY is not set.'
        );
      }
      return {
        provider: "claude",
        apiKey: env.ANTHROPIC_API_KEY,
        model: env.ANTHROPIC_MODEL,
      };

    case "openai":
      if (!env.OPENAI_API_KEY) {
        throw new Error(
          'Provider "openai" is configured but OPENAI_API_KEY is not set.'
        );
      }
      return {
        provider: "openai",
        apiKey: env.OPENAI_API_KEY,
        model: env.OPENAI_MODEL,
      };

    case "gemini":
      if (!env.GEMINI_API_KEY) {
        throw new Error(
          'Provider "gemini" is configured but GEMINI_API_KEY is not set.'
        );
      }
      return {
        provider: "gemini",
        apiKey: env.GEMINI_API_KEY,
        model: env.GEMINI_MODEL,
      };
  }
}

export const aiConfig = {
  primaryProvider: env.AI_EVALUATION_PROVIDER as LLMProviderName,

  fallbackProviders: parseFallbackProviders(),

  retry: {
    maxAttempts: env.AI_RETRY_MAX_ATTEMPTS,
    baseDelayMs: env.AI_RETRY_BASE_DELAY_MS,
  },

  validationRetryAttempts: env.AI_VALIDATION_RETRY_ATTEMPTS,
};
