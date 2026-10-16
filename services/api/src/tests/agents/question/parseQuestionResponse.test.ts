import { describe, expect, it } from "vitest";

import { parseQuestionResponse } from "../../../agents/question/prompts/parseQuestionResponse";
import { ApiError } from "../../../shared/errors/ApiError";

const validPayload = {
  question: "How would you scale a rate limiter across regions?",
  difficulty: "ADVANCED",
  isFollowUp: false,
  topic: "system-design",
  rationale: "Candidate handled the single-region case well.",
};

describe("parseQuestionResponse", () => {

  it("parses a well-formed response", () => {

    const result = parseQuestionResponse(JSON.stringify(validPayload));

    expect(result.question).toBe(validPayload.question);
    expect(result.difficulty).toBe("ADVANCED");
    expect(result.isFollowUp).toBe(false);

  });

  it("strips markdown code fences", () => {

    const fenced = "```json\n" + JSON.stringify(validPayload) + "\n```";

    expect(parseQuestionResponse(fenced).topic).toBe("system-design");

  });

  it("defaults a missing rationale to an empty string instead of failing", () => {

    const { rationale, ...withoutRationale } = validPayload;
    void rationale;

    const result = parseQuestionResponse(JSON.stringify(withoutRationale));

    expect(result.rationale).toBe("");

  });

  it("throws an ApiError for an invalid difficulty value", () => {

    expect(() =>
      parseQuestionResponse(
        JSON.stringify({ ...validPayload, difficulty: "EXPERT" })
      )
    ).toThrow(ApiError);

  });

  it("throws an ApiError when the text is not valid JSON", () => {

    expect(() => parseQuestionResponse("nonsense")).toThrow(ApiError);

  });

});
