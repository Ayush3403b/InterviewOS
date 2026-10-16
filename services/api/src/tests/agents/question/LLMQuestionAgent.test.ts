import { describe, expect, it, vi } from "vitest";

import { LLMQuestionAgent } from "../../../agents/question/LLMQuestionAgent";
import type { ILLMClient, LLMGenerateResult } from "../../../agents/llm/ILLMClient";

import {
  makeConversationTurnFixture,
  makeInterviewContextFixture,
  makeInterviewFixture,
} from "../../fixtures/agentFixtures";

const validQuestionJson = JSON.stringify({
  question: "What made this answer take longer than expected?",
  difficulty: "INTERMEDIATE",
  isFollowUp: true,
  topic: "debugging",
  rationale: "Following up on a vague earlier answer.",
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

const interview = makeInterviewFixture();
const context = makeInterviewContextFixture();
const previousTurns = [makeConversationTurnFixture()];

describe("LLMQuestionAgent", () => {

  it("returns a validated question on a well-formed first response", async () => {

    const client = makeFakeClient([validQuestionJson]);
    const agent = new LLMQuestionAgent(client);

    const result = await agent.generateNextQuestion(
      interview,
      context,
      previousTurns
    );

    expect(result.topic).toBe("debugging");
    expect(result.isFollowUp).toBe(true);
    expect(client.generate).toHaveBeenCalledTimes(1);

  });

  it("passes promptId/promptVersion/session/user through to the LLM client for cost tracking", async () => {

    const client = makeFakeClient([validQuestionJson]);
    const agent = new LLMQuestionAgent(client);

    await agent.generateNextQuestion(interview, context, previousTurns);

    expect(client.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        promptId: "question",
        interviewSessionId: interview.id,
      })
    );

  });

  it("retries the full cycle once on a validation failure, then succeeds", async () => {

    const client = makeFakeClient(["not json", validQuestionJson]);
    const agent = new LLMQuestionAgent(client, { validationRetryAttempts: 2 });

    const result = await agent.generateNextQuestion(
      interview,
      context,
      previousTurns
    );

    expect(result.topic).toBe("debugging");
    expect(client.generate).toHaveBeenCalledTimes(2);

  });

  it("throws once validationRetryAttempts is exhausted", async () => {

    const client = makeFakeClient(["still not json"]);
    const agent = new LLMQuestionAgent(client, { validationRetryAttempts: 2 });

    await expect(
      agent.generateNextQuestion(interview, context, previousTurns)
    ).rejects.toThrow();

    expect(client.generate).toHaveBeenCalledTimes(2);

  });

});
