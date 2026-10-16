import { afterEach, describe, expect, it, vi } from "vitest";

async function loadAiConfig(envOverrides: Record<string, unknown>) {
  vi.resetModules();

  vi.doMock("../../config/env", () => ({
    env: {
      AI_EVALUATION_PROVIDER: "mock",
      AI_FALLBACK_PROVIDERS: "",
      AI_RETRY_MAX_ATTEMPTS: 3,
      AI_RETRY_BASE_DELAY_MS: 500,
      AI_VALIDATION_RETRY_ATTEMPTS: 2,
      ANTHROPIC_MODEL: "claude-sonnet-4-6",
      OPENAI_MODEL: "gpt-4o-mini",
      GEMINI_MODEL: "gemini-2.0-flash",
      ...envOverrides,
    },
  }));

  return import("../../config/ai.config.js");
}

describe("ai.config", () => {

  afterEach(() => {
    vi.doUnmock("../../config/env");
  });

  it("returns credentials for a configured provider", async () => {

    const { getProviderCredentials } = await loadAiConfig({
      ANTHROPIC_API_KEY: "test-key",
    });

    expect(getProviderCredentials("claude")).toEqual({
      provider: "claude",
      apiKey: "test-key",
      model: "claude-sonnet-4-6",
    });

  });

  it("throws clearly when the provider's API key is missing", async () => {

    const { getProviderCredentials } = await loadAiConfig({});

    expect(() => getProviderCredentials("openai")).toThrow(
      /OPENAI_API_KEY/
    );

  });

  it("parses a comma-separated fallback provider list, ignoring invalid entries", async () => {

    const { aiConfig } = await loadAiConfig({
      AI_FALLBACK_PROVIDERS: "openai, gemini, not-a-real-provider",
    });

    expect(aiConfig.fallbackProviders).toEqual(["openai", "gemini"]);

  });

  it("defaults to an empty fallback list", async () => {

    const { aiConfig } = await loadAiConfig({});

    expect(aiConfig.fallbackProviders).toEqual([]);

  });

});
