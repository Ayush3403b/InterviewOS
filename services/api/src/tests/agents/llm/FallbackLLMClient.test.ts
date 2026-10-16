import { describe, expect, it, vi } from "vitest";

import { FallbackLLMClient } from "../../../agents/llm/FallbackLLMClient";
import type { ILLMClient, LLMGenerateResult } from "../../../agents/llm/ILLMClient";

function makeResult(provider: string): LLMGenerateResult {
  return { text: "{}", provider, model: "test-model", latencyMs: 10 };
}

function makeClient(
  provider: string,
  behavior: "succeed" | "fail"
): ILLMClient {
  return {
    provider,
    generate: vi.fn().mockImplementation(() =>
      behavior === "succeed"
        ? Promise.resolve(makeResult(provider))
        : Promise.reject(new Error(`${provider} failed`))
    ),
  };
}

describe("FallbackLLMClient", () => {

  it("throws if constructed with no clients", () => {

    expect(() => new FallbackLLMClient([])).toThrow();

  });

  it("uses the first client when it succeeds", async () => {

    const primary = makeClient("claude", "succeed");
    const secondary = makeClient("openai", "succeed");

    const client = new FallbackLLMClient([primary, secondary]);

    const result = await client.generate({ system: "s", prompt: "p" });

    expect(result.provider).toBe("claude");
    expect(secondary.generate).not.toHaveBeenCalled();

  });

  it("falls through to the next client when the first fails", async () => {

    const primary = makeClient("claude", "fail");
    const secondary = makeClient("openai", "succeed");

    const client = new FallbackLLMClient([primary, secondary]);

    const result = await client.generate({ system: "s", prompt: "p" });

    expect(result.provider).toBe("openai");
    expect(primary.generate).toHaveBeenCalledTimes(1);
    expect(secondary.generate).toHaveBeenCalledTimes(1);

  });

  it("throws once every client in the chain has failed", async () => {

    const first = makeClient("claude", "fail");
    const second = makeClient("openai", "fail");

    const client = new FallbackLLMClient([first, second]);

    await expect(
      client.generate({ system: "s", prompt: "p" })
    ).rejects.toThrow(/fallback chain failed/i);

  });

});
