import { describe, expect, it } from "vitest";

import { MockReportAgent } from "../../../agents/report/MockReportAgent";
import type { ReportNarrativeInput } from "../../../agents/report/IReportAgent";

const baseInput: ReportNarrativeInput = {
  candidateName: "Jordan Lee",
  interviewTitle: "Backend Engineer Interview",
  interviewType: "TECHNICAL",
  interviewLevel: "INTERMEDIATE",
  overallScore: 82,
  hiringRecommendation: "HIRE",
  strengths: ["Strong problem solving", "Clear communication"],
  weaknesses: ["Limited system design depth"],
  weakTopics: ["System design"],
};

describe("MockReportAgent", () => {

  it("includes the candidate name, score, and interview title", async () => {

    const agent = new MockReportAgent();
    const result = await agent.generateNarrative(baseInput);

    expect(result.executiveSummary).toContain("Jordan Lee");
    expect(result.executiveSummary).toContain("82/100");
    expect(result.executiveSummary).toContain("Backend Engineer Interview");

  });

  it("mentions strengths when present", async () => {

    const agent = new MockReportAgent();
    const result = await agent.generateNarrative(baseInput);

    expect(result.executiveSummary.toLowerCase()).toContain("strong problem solving");

  });

  it("mentions the top weak topic when present", async () => {

    const agent = new MockReportAgent();
    const result = await agent.generateNarrative(baseInput);

    expect(result.executiveSummary.toLowerCase()).toContain("system design");

  });

  it("handles an unknown hiring recommendation gracefully", async () => {

    const agent = new MockReportAgent();
    const result = await agent.generateNarrative({
      ...baseInput,
      hiringRecommendation: "SOMETHING_UNEXPECTED",
    });

    expect(result.executiveSummary).toContain("requires manual review");

  });

  it("still produces a coherent summary with no strengths or weak topics", async () => {

    const agent = new MockReportAgent();
    const result = await agent.generateNarrative({
      ...baseInput,
      strengths: [],
      weakTopics: [],
    });

    expect(result.executiveSummary.length).toBeGreaterThan(0);
    expect(result.executiveSummary).toContain("Jordan Lee");

  });

});
