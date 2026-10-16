import { describe, expect, it } from "vitest";

import { buildReportPdf } from "../../../shared/pdf/buildReportPdf";
import type { ReportDocument } from "../../../modules/report/types/report.types";

function makeReportFixture(): ReportDocument {
  return {
    candidateName: "Jordan Lee",
    interviewTitle: "Backend Engineer Interview",
    interviewType: "TECHNICAL",
    interviewLevel: "INTERMEDIATE",
    overallScore: 82,
    skillScores: { technical: 85, communication: 80, problemSolving: 82, confidence: 80 },
    strengths: ["Strong problem solving"],
    weaknesses: ["Limited system design depth"],
    hiringRecommendation: "HIRE",
    executiveSummary: "Jordan performed well overall.",
    questionEvaluations: [
      { turnNumber: 1, question: "What is a closure?", answer: "...", score: 90, feedback: "Great answer." },
    ],
    weakTopics: ["System design"],
    learningRoadmap: [
      { topic: "System design", action: "Study distributed systems.", priority: "HIGH" },
    ],
    recommendedResources: [],
  } as unknown as ReportDocument;
}

describe("buildReportPdf", () => {

  it("produces a non-empty buffer starting with the PDF magic bytes", async () => {

    const buffer = await buildReportPdf(makeReportFixture());

    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");

  });

  it("handles a report with no strengths/weaknesses/roadmap without throwing", async () => {

    const fixture = {
      ...makeReportFixture(),
      strengths: [],
      weaknesses: [],
      questionEvaluations: [],
      learningRoadmap: [],
    } as unknown as ReportDocument;

    const buffer = await buildReportPdf(fixture);

    expect(buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");

  });

});
