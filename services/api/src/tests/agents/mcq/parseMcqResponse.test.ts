import { describe, expect, it } from "vitest";

import { parseMcqResponse } from "../../../agents/mcq/prompts/parseMcqResponse";
import { ApiError } from "../../../shared/errors/ApiError";

function mcq(overrides: Record<string, unknown> = {}) {
  return {
    question: "Which keyword declares a block-scoped variable?",
    options: ["var", "let", "function", "this"],
    correctOptionIndex: 1,
    explanation: "let is block-scoped.",
    topic: "JavaScript",
    difficulty: "EASY",
    ...overrides,
  };
}

describe("parseMcqResponse", () => {

  it("parses a well-formed envelope", () => {

    const result = parseMcqResponse(
      JSON.stringify({ mode: "GENERATED", questions: [mcq()] })
    );

    expect(result.mode).toBe("GENERATED");
    expect(result.questions).toHaveLength(1);
    expect(result.droppedCount).toBe(0);

  });

  it("keeps the valid questions and drops the broken ones", () => {

    const result = parseMcqResponse(
      JSON.stringify({
        questions: [
          mcq(),
          mcq({ correctOptionIndex: 9 }), // points past the options
          mcq({ options: ["same", "Same"] }), // not distinct
          mcq({ options: ["only one"] }), // too few options
        ],
      })
    );

    expect(result.questions).toHaveLength(1);
    expect(result.droppedCount).toBe(3);

  });

  it("accepts a bare array and fenced JSON", () => {

    const result = parseMcqResponse(
      "```json\n" + JSON.stringify([mcq(), mcq({ question: "Second?" })]) + "\n```"
    );

    expect(result.questions).toHaveLength(2);

  });

  it("normalises difficulty casing and fills optional fields", () => {

    const result = parseMcqResponse(
      JSON.stringify({
        questions: [
          { question: "Q?", options: ["a", "b"], correctOptionIndex: 0, difficulty: "hard" },
        ],
      })
    );

    expect(result.questions[0]).toMatchObject({
      difficulty: "HARD",
      explanation: "",
      topic: "",
    });

  });

  it("returns an empty list (not an error) when the model found nothing usable", () => {

    const result = parseMcqResponse(JSON.stringify({ mode: "GENERATED", questions: [] }));

    expect(result.questions).toEqual([]);

  });

  it("throws when every question in a non-empty batch is invalid", () => {

    expect(() =>
      parseMcqResponse(
        JSON.stringify({ questions: [mcq({ correctOptionIndex: -1 })] })
      )
    ).toThrow(ApiError);

  });

  it("throws on non-JSON output", () => {

    expect(() => parseMcqResponse("Sorry, I can't help with that.")).toThrow(
      /not valid JSON/
    );

  });

});
