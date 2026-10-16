import { describe, expect, it } from "vitest";

import { adaptDifficulty } from "../../../agents/question/adaptDifficulty";

describe("adaptDifficulty", () => {

  it("returns the base level when there's no answer history yet", () => {
    expect(adaptDifficulty("INTERMEDIATE", [], [])).toBe("INTERMEDIATE");
  });

  it("escalates one level after a strong answer", () => {
    expect(adaptDifficulty("INTERMEDIATE", ["INTERMEDIATE"], [80])).toBe("ADVANCED");
  });

  it("does not escalate past ADVANCED", () => {
    expect(adaptDifficulty("INTERMEDIATE", ["ADVANCED"], [95])).toBe("ADVANCED");
  });

  it("eases off one level after a weak answer", () => {
    expect(adaptDifficulty("INTERMEDIATE", ["INTERMEDIATE"], [20])).toBe("BEGINNER");
  });

  it("does not ease off past BEGINNER", () => {
    expect(adaptDifficulty("INTERMEDIATE", ["BEGINNER"], [10])).toBe("BEGINNER");
  });

  it("holds steady for a middling answer", () => {
    expect(adaptDifficulty("INTERMEDIATE", ["ADVANCED"], [55])).toBe("ADVANCED");
  });

  it("reacts to only the most recent score, not the full history", () => {
    expect(
      adaptDifficulty("INTERMEDIATE", ["INTERMEDIATE", "BEGINNER"], [20, 90])
    ).toBe("INTERMEDIATE");
  });

  it("falls back to the base level if difficultyHistory has an unrecognized value", () => {
    expect(
      adaptDifficulty("INTERMEDIATE", ["NOT_A_REAL_LEVEL"], [80])
    ).toBe("INTERMEDIATE");
  });

});
