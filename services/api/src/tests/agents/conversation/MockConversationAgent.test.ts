import { describe, expect, it } from "vitest";

import { MockConversationAgent } from "../../../agents/conversation/MockConversationAgent";

describe("MockConversationAgent", () => {

  it("appends the new turn onto the previous summary", async () => {

    const agent = new MockConversationAgent();

    const result = await agent.summarizeTurn(
      "Previous summary line.",
      "What is a closure?",
      "A function with its lexical scope."
    );

    expect(result.summary).toContain("Previous summary line.");
    expect(result.summary).toContain("What is a closure?");
    expect(result.newTopics).toEqual([]);

  });

  it("handles an empty previous summary (first turn)", async () => {

    const agent = new MockConversationAgent();

    const result = await agent.summarizeTurn("", "Q", "A");

    expect(result.summary).toContain("Q -> A");

  });

  it("truncates to a bounded length instead of growing unbounded", async () => {

    const agent = new MockConversationAgent();
    const longSummary = "x".repeat(2000);

    const result = await agent.summarizeTurn(longSummary, "Q", "A");

    expect(result.summary.length).toBeLessThanOrEqual(1000);

  });

  it("scores an empty answer at 0", async () => {

    const agent = new MockConversationAgent();

    const result = await agent.summarizeTurn("", "Q", "");

    expect(result.answerQuality).toBe(0);

  });

  it("scores a longer, more substantial answer higher than a short one", async () => {

    const agent = new MockConversationAgent();

    const short = await agent.summarizeTurn("", "Q", "Not sure.");
    const long = await agent.summarizeTurn(
      "",
      "Q",
      "A closure is a function bundled together with references to its " +
      "surrounding lexical scope. It lets the function access variables " +
      "from an outer scope even after that outer function has returned, " +
      "which is commonly used for data privacy and factory functions."
    );

    expect(long.answerQuality).toBeGreaterThan(short.answerQuality);

  });

  it("keeps answerQuality within 0-100", async () => {

    const agent = new MockConversationAgent();

    const result = await agent.summarizeTurn("", "Q", "word ".repeat(500));

    expect(result.answerQuality).toBeGreaterThanOrEqual(0);
    expect(result.answerQuality).toBeLessThanOrEqual(100);

  });

});
