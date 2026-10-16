import { describe, expect, it, vi } from "vitest";

import { LLMReportAgent } from "../../../agents/report/LLMReportAgent";
import type { ILLMClient, LLMGenerateResult } from "../../../agents/llm/ILLMClient";
import type { ReportNarrativeInput } from "../../../agents/report/IReportAgent";

const validJson = JSON.stringify({
  executiveSummary: "Jordan performed well technically but should work on system design.",
  candidateFeedback: "Focus on deepening distributed systems concepts and trade-off explanations.",
  recruiterBrief: "Strong mid-level candidate with solid problem-solving fundamentals.",
  executiveDigest: "Recommended for hire with targeted onboarding in system architecture.",
});

const input: ReportNarrativeInput = {
  candidateName: "Jordan Lee",
  interviewTitle: "Backend Engineer Interview",
  interviewType: "TECHNICAL",
  interviewLevel: "INTERMEDIATE",
  overallScore: 82,
  hiringRecommendation: "HIRE",
  strengths: ["Strong problem solving"],
  weaknesses: ["Limited system design depth"],
  weakTopics: ["System design"],
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

describe("LLMReportAgent", () => {

  it("returns a validated narrative on a well-formed response", async () => {

    const client = makeFakeClient([validJson]);
    const agent = new LLMReportAgent(client);

    const result = await agent.generateNarrative(input);

    expect(result.executiveSummary).toContain("Jordan");
    expect(client.generate).toHaveBeenCalledTimes(1);

  });

  it("passes promptId/promptVersion through for cost tracking", async () => {

    const client = makeFakeClient([validJson]);
    const agent = new LLMReportAgent(client);

    await agent.generateNarrative(input);

    expect(client.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        promptId: "report-narrative",
        promptVersion: "v2",
      })
    );

  });

  it("retries once on a validation failure, then succeeds", async () => {

    const client = makeFakeClient(["not json", validJson]);
    const agent = new LLMReportAgent(client, { validationRetryAttempts: 2 });

    const result = await agent.generateNarrative(input);

    expect(result.executiveSummary).toContain("Jordan");
    expect(client.generate).toHaveBeenCalledTimes(2);

  });

  it("throws once validationRetryAttempts is exhausted", async () => {

    const client = makeFakeClient(["still not json"]);
    const agent = new LLMReportAgent(client, { validationRetryAttempts: 2 });

    await expect(agent.generateNarrative(input)).rejects.toThrow();
    expect(client.generate).toHaveBeenCalledTimes(2);

  });

});
