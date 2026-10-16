import { describe, expect, it } from "vitest";
import { cleanJsonString, safeExtractJson } from "../../../agents/llm/jsonCleaner";

describe("jsonCleaner", () => {
  it("cleans standard markdown json fences", () => {
    const raw = "```json\n{\"score\": 85, \"topic\": \"System Design\"}\n```";
    expect(safeExtractJson<{ score: number }>(raw).score).toBe(85);
  });

  it("strips <thought> and <thinking> tags from free-tier models", () => {
    const raw = `
      <thought>
        The candidate demonstrated strong system design skills. I should rate them 90.
      </thought>
      \`\`\`json
      { "score": 90, "strengths": ["Clean architecture"] }
      \`\`\`
    `;
    const result = safeExtractJson<{ score: number }>(raw);
    expect(result.score).toBe(90);
  });

  it("extracts JSON even with leading and trailing conversational preambles", () => {
    const raw = `
      Here is the evaluation response you requested:

      {
        "overallScore": 88,
        "recommendation": "HIRE",
      }

      Let me know if you need anything else!
    `;
    const result = safeExtractJson<{ overallScore: number; recommendation: string }>(raw);
    expect(result.overallScore).toBe(88);
    expect(result.recommendation).toBe("HIRE");
  });

  it("cleans trailing commas in objects and arrays", () => {
    const raw = `
      {
        "items": ["apple", "banana",],
        "nested": {
          "a": 1,
          "b": 2,
        },
      }
    `;
    const result = safeExtractJson<{ items: string[]; nested: { a: number } }>(raw);
    expect(result.items).toEqual(["apple", "banana"]);
    expect(result.nested.a).toBe(1);
  });
});
