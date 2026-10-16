import { describe, expect, it, vi } from "vitest";

import { LLMConversationAgent } from "../../../agents/conversation/LLMConversationAgent";
import type { ILLMClient, LLMGenerateResult } from "../../../agents/llm/ILLMClient";

const validSummaryJson = JSON.stringify({
  summary: "Candidate discussed closures and event loop internals.",
  newTopics: ["javascript", "event-loop"],
  answerQuality: 82,
});

function makeFakeClient(responses: string[]): ILLMClient {
  let call = 0;

  return {
    provider: "fake",
    generate: vi.fn().mockImplementation(
      (): Promise<LLMGenerateResult> => {
        const text = responses[Math.min(call, responses.length - 1)];
        call++;
        return Promise.resolve({
          text,
          provider: "fake",
          model: "fake-model",
          latencyMs: 5,
        });
      }
    ),
  };
}

describe("LLMConversationAgent", () => {

  it("returns a validated summary on a well-formed response", async () => {

    const client = makeFakeClient([validSummaryJson]);
    const agent = new LLMConversationAgent(client);

    const result = await agent.summarizeTurn("prev", "Q", "A");

    expect(result.summary).toContain("closures");
    expect(result.newTopics).toEqual(["javascript", "event-loop"]);

  });

  it("retries once on a validation failure, then succeeds", async () => {

    const client = makeFakeClient(["not valid json", validSummaryJson]);
    const agent = new LLMConversationAgent(client, {
      validationRetryAttempts: 2,
    });

    const result = await agent.summarizeTurn("prev", "Q", "A");

    expect(result.newTopics).toEqual(["javascript", "event-loop"]);
    expect(client.generate).toHaveBeenCalledTimes(2);

  });

  it("throws once retries are exhausted", async () => {

    const client = makeFakeClient(["nope"]);
    const agent = new LLMConversationAgent(client, {
      validationRetryAttempts: 2,
    });

    await expect(agent.summarizeTurn("prev", "Q", "A")).rejects.toThrow();
    expect(client.generate).toHaveBeenCalledTimes(2);

  });

});
