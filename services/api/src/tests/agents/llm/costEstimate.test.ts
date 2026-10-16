import { describe, expect, it } from "vitest";

import { estimateCostUsd } from "../../../agents/llm/costEstimate";

describe("estimateCostUsd", () => {

  it("returns undefined when tokensUsed is undefined", () => {

    expect(estimateCostUsd("claude", undefined)).toBeUndefined();

  });

  it("returns undefined for an unknown provider", () => {

    expect(estimateCostUsd("unknown-provider", 1000)).toBeUndefined();

  });

  it("computes a proportional estimate for a known provider", () => {

    const cost = estimateCostUsd("claude", 1000);

    expect(cost).toBe(0.006);

  });

  it("scales linearly with token count", () => {

    const oneK = estimateCostUsd("openai", 1000)!;
    const twoK = estimateCostUsd("openai", 2000)!;

    expect(twoK).toBeCloseTo(oneK * 2, 6);

  });

});
