import { describe, expect, it } from "vitest";

import { parseEvaluationResponse } from "../../../agents/evaluation/prompts/parseEvaluationResponse";
import { HiringRecommendation } from "../../../modules/evaluation/types/evaluation.types";
import { ApiError } from "../../../shared/errors/ApiError";

const metadata = {
  provider: "Test",
  model: "test-model",
  latencyMs: 123,
  tokensUsed: 456,
};

const validPayload = {
  overallScore: 88,
  skillScores: {
    technical: 90,
    communication: 85,
    problemSolving: 92,
    confidence: 80,
    leadership: 75,
    criticalThinking: 85,
  },
  strengths: ["Clear explanations"],
  weaknesses: ["Limited depth on system design"],
  recommendations: ["Practice distributed systems"],
  overallSummary: "Strong candidate overall.",
  hiringRecommendation: "HIRE",
  questionEvaluations: [
    {
      turnNumber: 1,
      question: "What is a closure?",
      answer: "A function with its lexical scope.",
      score: 90,
      feedback: "Accurate and concise.",
    },
  ],
};

describe("parseEvaluationResponse", () => {

  it("parses a well-formed JSON response", () => {

    const result = parseEvaluationResponse(
      JSON.stringify(validPayload),
      metadata
    );

    expect(result.overallScore).toBe(88);
    expect(result.skillScores.technical).toBe(90);
    expect(result.hiringRecommendation).toBe(HiringRecommendation.HIRE);
    expect(result.questionEvaluations).toHaveLength(1);
    expect(result.metadata).toEqual({
      provider: "Test",
      model: "test-model",
      promptVersion: "v2",
      latencyMs: 123,
      tokensUsed: 456,
    });

  });

  it("strips markdown code fences before parsing", () => {

    const fenced = "```json\n" + JSON.stringify(validPayload) + "\n```";

    const result = parseEvaluationResponse(fenced, metadata);

    expect(result.overallScore).toBe(88);

  });

  it("throws an ApiError when the text is not valid JSON", () => {

    expect(() =>
      parseEvaluationResponse("this is not json", metadata)
    ).toThrow(ApiError);

  });

  it("throws an ApiError when scores are out of the 0-100 range", () => {

    expect(() =>
      parseEvaluationResponse(
        JSON.stringify({ ...validPayload, overallScore: 150 }),
        metadata
      )
    ).toThrow(ApiError);

  });

  it("throws an ApiError for an invalid hiring recommendation", () => {

    expect(() =>
      parseEvaluationResponse(
        JSON.stringify({ ...validPayload, hiringRecommendation: "MAYBE" }),
        metadata
      )
    ).toThrow(ApiError);

  });

  it("throws an ApiError instead of silently defaulting missing fields", () => {

    expect(() =>
      parseEvaluationResponse(
        JSON.stringify({ overallScore: 50 }),
        metadata
      )
    ).toThrow(ApiError);

  });

  it("includes the field path in the error message for easier debugging", () => {

    try {
      parseEvaluationResponse(
        JSON.stringify({ ...validPayload, overallScore: 150 }),
        metadata
      );
      throw new Error("expected parseEvaluationResponse to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).message).toContain("overallScore");
    }

  });

});
