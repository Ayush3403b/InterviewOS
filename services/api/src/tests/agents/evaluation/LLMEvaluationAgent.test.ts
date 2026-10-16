import { describe, expect, it, vi } from "vitest";

import { LLMEvaluationAgent } from "../../../agents/evaluation/LLMEvaluationAgent";
import type { ILLMClient, LLMGenerateResult } from "../../../agents/llm/ILLMClient";
import { HiringRecommendation } from "../../../modules/evaluation/types/evaluation.types";

import { makeConversationFixture, makeInterviewFixture } from "./fixtures";

const validEvaluationJson = JSON.stringify({
  overallScore: 82,
  skillScores: {
    technical: 80,
    communication: 85,
    problemSolving: 78,
    confidence: 84,
    leadership: 75,
    criticalThinking: 80,
  },
  strengths: ["Solid fundamentals"],
  weaknesses: ["Could go deeper on trade-offs"],
  recommendations: ["Study system design patterns"],
  overallSummary: "A strong candidate.",
  hiringRecommendation: "HIRE",
  questionEvaluations: [],
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
const conversation = makeConversationFixture();

describe("LLMEvaluationAgent", () => {

  it("returns a validated evaluation on a well-formed first response", async () => {

    const client = makeFakeClient([validEvaluationJson]);
    const agent = new LLMEvaluationAgent(client);

    const result = await agent.evaluate(interview, conversation);

    expect(result.overallScore).toBe(82);
    expect(result.hiringRecommendation).toBe(HiringRecommendation.HIRE);
    expect(client.generate).toHaveBeenCalledTimes(1);

  });

  it("retries the full generate+validate cycle when the first response fails validation", async () => {

    const client = makeFakeClient(["not valid json at all", validEvaluationJson]);
    const agent = new LLMEvaluationAgent(client, { validationRetryAttempts: 2 });

    const result = await agent.evaluate(interview, conversation);

    expect(result.overallScore).toBe(82);
    expect(client.generate).toHaveBeenCalledTimes(2);

  });

  it("throws once validationRetryAttempts is exhausted on repeated bad output", async () => {

    const client = makeFakeClient(["still not valid json"]);
    const agent = new LLMEvaluationAgent(client, { validationRetryAttempts: 2 });

    await expect(agent.evaluate(interview, conversation)).rejects.toThrow();
    expect(client.generate).toHaveBeenCalledTimes(2);

  });

});
