import { describe, expect, it } from "vitest";

import { parseReportNarrative } from "../../../agents/report/prompts/parseReportNarrative";
import { ApiError } from "../../../shared/errors/ApiError";

describe("parseReportNarrative", () => {

  it("parses a well-formed response", () => {

    const result = parseReportNarrative(
      JSON.stringify({
        executiveSummary: "A strong candidate overall.",
        candidateFeedback: "Focus on deepening system design concepts.",
        recruiterBrief: "Strong candidate with solid fundamentals.",
        executiveDigest: "Recommended for hire.",
      })
    );

    expect(result.executiveSummary).toBe("A strong candidate overall.");
    expect(result.candidateFeedback).toContain("system design");

  });

  it("strips markdown code fences", () => {

    const fenced =
      '```json\n{"executiveSummary": "Solid performance.", "candidateFeedback": "Good.", "recruiterBrief": "Solid.", "executiveDigest": "Hire."}\n```';

    expect(parseReportNarrative(fenced).executiveSummary).toBe("Solid performance.");

  });

  it("throws an ApiError when executiveSummary is missing", () => {

    expect(() => parseReportNarrative(JSON.stringify({}))).toThrow(ApiError);

  });

  it("throws an ApiError when executiveSummary is empty", () => {

    expect(() =>
      parseReportNarrative(JSON.stringify({ executiveSummary: "" }))
    ).toThrow(ApiError);

  });

  it("throws an ApiError when the text is not valid JSON", () => {

    expect(() => parseReportNarrative("nonsense")).toThrow(ApiError);

  });

});
