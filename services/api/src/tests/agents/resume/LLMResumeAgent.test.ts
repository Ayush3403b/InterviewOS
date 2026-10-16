import { describe, expect, it, vi } from "vitest";

import { LLMResumeAgent } from "../../../agents/resume/LLMResumeAgent";
import type { ILLMClient, LLMGenerateResult } from "../../../agents/llm/ILLMClient";

const validResumeJson = JSON.stringify({
  summary: "Frontend engineer with strong React and TypeScript background.",
  extractedSkills: ["React", "TypeScript"],
  atsScore: 72,
  suggestions: ["Add measurable impact to each bullet point."],
  experience: [
    {
      title: "Frontend Engineer",
      company: "Widgets Inc",
      duration: "2020 - Present",
      highlights: ["Rebuilt the checkout flow in React."],
    },
  ],
  education: [],
  projects: [],
  certifications: [],
  missingSkills: ["Testing"],
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

describe("LLMResumeAgent", () => {

  it("returns a validated analysis on a well-formed response", async () => {

    const client = makeFakeClient([validResumeJson]);
    const agent = new LLMResumeAgent(client);

    const result = await agent.analyze("some resume text");

    expect(result.atsScore).toBe(72);
    expect(result.extractedSkills).toEqual(["React", "TypeScript"]);
    expect(client.generate).toHaveBeenCalledTimes(1);

  });

  it("passes promptId/promptVersion through for cost tracking", async () => {

    const client = makeFakeClient([validResumeJson]);
    const agent = new LLMResumeAgent(client);

    await agent.analyze("some resume text");

    expect(client.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        promptId: "resume-analysis",
        promptVersion: "v2",
      })
    );

  });

  it("retries once on a validation failure, then succeeds", async () => {

    const client = makeFakeClient(["not json", validResumeJson]);
    const agent = new LLMResumeAgent(client, { validationRetryAttempts: 2 });

    const result = await agent.analyze("some resume text");

    expect(result.atsScore).toBe(72);
    expect(client.generate).toHaveBeenCalledTimes(2);

  });

  it("throws once validationRetryAttempts is exhausted", async () => {

    const client = makeFakeClient(["still not json"]);
    const agent = new LLMResumeAgent(client, { validationRetryAttempts: 2 });

    await expect(agent.analyze("some resume text")).rejects.toThrow();
    expect(client.generate).toHaveBeenCalledTimes(2);

  });

});
