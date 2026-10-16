import { describe, expect, it, vi } from "vitest";

import { PersistingLLMClient } from "../../../agents/llm/PersistingLLMClient";
import type { ILLMClient } from "../../../agents/llm/ILLMClient";

function makeInnerClient(behavior: "succeed" | "fail"): ILLMClient {
  return {
    provider: "claude",
    generate: vi.fn().mockImplementation(() =>
      behavior === "succeed"
        ? Promise.resolve({
            text: "hello",
            provider: "claude",
            model: "claude-sonnet-4-6",
            latencyMs: 42,
            tokensUsed: 100,
          })
        : Promise.reject(new Error("provider exploded"))
    ),
  };
}

describe("PersistingLLMClient", () => {

  it("records a successful call with an estimated cost and returns the result unchanged", async () => {

    const recorder = { record: vi.fn() };
    const client = new PersistingLLMClient(makeInnerClient("succeed"), recorder);

    const result = await client.generate({
      system: "s",
      prompt: "p",
      promptId: "evaluation",
      promptVersion: "v1",
      interviewSessionId: "session-1",
      userId: "user-1",
    });

    expect(result.text).toBe("hello");
    expect(recorder.record).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "claude",
        modelName: "claude-sonnet-4-6",
        promptId: "evaluation",
        promptVersion: "v1",
        tokensUsed: 100,
        success: true,
        interviewSessionId: "session-1",
        userId: "user-1",
        estimatedCostUsd: expect.any(Number),
      })
    );

  });

  it("records a failed call and still propagates the original error", async () => {

    const recorder = { record: vi.fn() };
    const client = new PersistingLLMClient(makeInnerClient("fail"), recorder);

    await expect(
      client.generate({ system: "s", prompt: "p" })
    ).rejects.toThrow("provider exploded");

    expect(recorder.record).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "claude",
        success: false,
        errorMessage: "provider exploded",
      })
    );

  });

  it("defaults promptId/promptVersion to \"unknown\" when the caller doesn't provide them", async () => {

    const recorder = { record: vi.fn() };
    const client = new PersistingLLMClient(makeInnerClient("succeed"), recorder);

    await client.generate({ system: "s", prompt: "p" });

    expect(recorder.record).toHaveBeenCalledWith(
      expect.objectContaining({ promptId: "unknown", promptVersion: "unknown" })
    );

  });

  it("exposes the inner client's provider name", () => {

    const client = new PersistingLLMClient(makeInnerClient("succeed"), {
      record: vi.fn(),
    });

    expect(client.provider).toBe("claude");

  });

});
