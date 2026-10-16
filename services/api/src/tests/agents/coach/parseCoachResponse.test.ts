import { describe, expect, it } from "vitest";

import { parseCoachResponse } from "../../../agents/coach/prompts/parseCoachResponse";
import { ApiError } from "../../../shared/errors/ApiError";

const validPayload = {
  personalizedFeedback: "You did well on communication but struggled with algorithms.",
  weakTopics: ["Algorithms"],
  learningRoadmap: [
    { topic: "Algorithms", action: "Practice LeetCode mediums daily.", priority: "HIGH" },
  ],
  recommendedResources: [
    { title: "Algorithm design manual", type: "COURSE", reason: "Fill algorithm gaps." },
  ],
  careerGuidance: "Keep practicing and you'll be ready in a few weeks.",
};

describe("parseCoachResponse", () => {

  it("parses a well-formed response", () => {

    const result = parseCoachResponse(JSON.stringify(validPayload));

    expect(result.weakTopics).toEqual(["Algorithms"]);
    expect(result.learningRoadmap[0].priority).toBe("HIGH");

  });

  it("strips markdown code fences", () => {

    const fenced = "```json\n" + JSON.stringify(validPayload) + "\n```";

    expect(parseCoachResponse(fenced).careerGuidance).toContain("practicing");

  });

  it("accepts an empty weakTopics array", () => {

    const result = parseCoachResponse(
      JSON.stringify({ ...validPayload, weakTopics: [] })
    );

    expect(result.weakTopics).toEqual([]);

  });

  it("throws an ApiError when learningRoadmap is empty", () => {

    expect(() =>
      parseCoachResponse(JSON.stringify({ ...validPayload, learningRoadmap: [] }))
    ).toThrow(ApiError);

  });

  it("throws an ApiError for an invalid priority value", () => {

    expect(() =>
      parseCoachResponse(
        JSON.stringify({
          ...validPayload,
          learningRoadmap: [
            { topic: "X", action: "Y", priority: "URGENT" },
          ],
        })
      )
    ).toThrow(ApiError);

  });

  it("throws an ApiError when recommendedResources is empty", () => {

    expect(() =>
      parseCoachResponse(
        JSON.stringify({ ...validPayload, recommendedResources: [] })
      )
    ).toThrow(ApiError);

  });

  it("throws an ApiError when the text is not valid JSON", () => {

    expect(() => parseCoachResponse("nonsense")).toThrow(ApiError);

  });

});
