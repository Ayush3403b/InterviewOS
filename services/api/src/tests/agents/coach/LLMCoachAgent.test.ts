import { describe, expect, it, vi } from "vitest";

import { LLMCoachAgent } from "../../../agents/coach/LLMCoachAgent";
import type { ILLMClient, LLMGenerateResult } from "../../../agents/llm/ILLMClient";
import type { CoachingInput } from "../../../agents/coach/ICoachAgent";

const validCoachJson = JSON.stringify({
  personalizedFeedback: "Strong technical performance, work on confidence.",
  weakTopics: ["Confidence"],
  learningRoadmap: [
    { topic: "Confidence", action: "Do 3 mock interviews this week.", priority: "MEDIUM" },
  ],
  recommendedResources: [
    { title: "Mock interview practice", type: "PRACTICE", reason: "Builds delivery confidence." },
  ],
  careerGuidance: "You're close - a bit more practice and you'll be ready.",
});

const input: CoachingInput = {
  overallScore: 75,
  skillScores: { technical: 85, communication: 80, problemSolving: 78, confidence: 60 },
  strengths: ["Strong technical answers"],
  weaknesses: ["Seemed nervous"],
  overallSummary: "Good technical candidate, nerves held them back.",
  hiringRecommendation: "HIRE",
  interviewType: "TECHNICAL",
  interviewLevel: "INTERMEDIATE",
};

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

describe("LLMCoachAgent", () => {

  it("returns a validated coaching plan on a well-formed response", async () => {

    const client = makeFakeClient([validCoachJson]);
    const agent = new LLMCoachAgent(client);

    const result = await agent.generateCoaching(input);

    expect(result.weakTopics).toEqual(["Confidence"]);
    expect(client.generate).toHaveBeenCalledTimes(1);

  });

  it("passes promptId/promptVersion through for cost tracking", async () => {

    const client = makeFakeClient([validCoachJson]);
    const agent = new LLMCoachAgent(client);

    await agent.generateCoaching(input);

    expect(client.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        promptId: "coaching-plan",
        promptVersion: "v1",
      })
    );

  });

  it("retries once on a validation failure, then succeeds", async () => {

    const client = makeFakeClient(["not json", validCoachJson]);
    const agent = new LLMCoachAgent(client, { validationRetryAttempts: 2 });

    const result = await agent.generateCoaching(input);

    expect(result.weakTopics).toEqual(["Confidence"]);
    expect(client.generate).toHaveBeenCalledTimes(2);

  });

  it("throws once validationRetryAttempts is exhausted", async () => {

    const client = makeFakeClient(["still not json"]);
    const agent = new LLMCoachAgent(client, { validationRetryAttempts: 2 });

    await expect(agent.generateCoaching(input)).rejects.toThrow();
    expect(client.generate).toHaveBeenCalledTimes(2);

  });

});
