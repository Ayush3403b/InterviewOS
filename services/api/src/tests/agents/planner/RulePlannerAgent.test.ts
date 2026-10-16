import { describe, expect, it } from "vitest";

import { RulePlannerAgent } from "../../../agents/planner/RulePlannerAgent";

import {
  makeConversationTurnFixture,
  makeInterviewContextFixture,
  makeInterviewFixture,
} from "../../fixtures/agentFixtures";

describe("RulePlannerAgent", () => {

  it("asks another question when under the question budget", async () => {

    const planner = new RulePlannerAgent();
    const interview = makeInterviewFixture({ maxQuestions: 3 });

    const turns = [
      makeConversationTurnFixture({ answer: "answer one" }),
    ];

    const decision = await planner.decideNextAction(interview, null, turns);

    expect(decision.action).toBe("ASK_QUESTION");

  });

  it("wraps up once the answered count reaches the question budget", async () => {

    const planner = new RulePlannerAgent();
    const interview = makeInterviewFixture({ maxQuestions: 2 });

    const turns = [
      makeConversationTurnFixture({ answer: "one" }),
      makeConversationTurnFixture({ answer: "two" }),
    ];

    const decision = await planner.decideNextAction(interview, null, turns);

    expect(decision.action).toBe("WRAP_UP");

  });

  it("only counts turns that actually have a non-empty answer", async () => {

    const planner = new RulePlannerAgent();
    const interview = makeInterviewFixture({ maxQuestions: 2 });

    const turns = [
      makeConversationTurnFixture({ answer: "one" }),
      makeConversationTurnFixture({ answer: "" }),
      makeConversationTurnFixture({ answer: undefined }),
    ];

    const decision = await planner.decideNextAction(interview, null, turns);

    expect(decision.action).toBe("ASK_QUESTION");

  });

  describe("proctoring-aware wrap-up", () => {

    it("wraps up immediately on critical proctoring risk, even under budget", async () => {

      const planner = new RulePlannerAgent();
      const interview = makeInterviewFixture({ maxQuestions: 10 });
      const turns = [makeConversationTurnFixture({ answer: "one" })];

      const decision = await planner.decideNextAction(interview, null, turns, {
        riskScore: 80,
        riskLevel: "critical",
        status: "FLAGGED",
      });

      expect(decision.action).toBe("WRAP_UP");
      expect(decision.reason).toContain("critical risk");

    });

    it("wraps up if proctoring already terminated the session", async () => {

      const planner = new RulePlannerAgent();
      const interview = makeInterviewFixture({ maxQuestions: 10 });
      const turns: ReturnType<typeof makeConversationTurnFixture>[] = [];

      const decision = await planner.decideNextAction(interview, null, turns, {
        riskScore: 10,
        riskLevel: "low",
        status: "TERMINATED",
      });

      expect(decision.action).toBe("WRAP_UP");
      expect(decision.reason).toContain("terminated");

    });

    it("continues normally when risk is present but below the critical threshold", async () => {

      const planner = new RulePlannerAgent();
      const interview = makeInterviewFixture({ maxQuestions: 10 });
      const turns = [makeConversationTurnFixture({ answer: "one" })];

      const decision = await planner.decideNextAction(interview, null, turns, {
        riskScore: 40,
        riskLevel: "medium",
        status: "FLAGGED",
      });

      expect(decision.action).toBe("ASK_QUESTION");

    });

    it("treats a missing summary as nothing to factor in", async () => {

      const planner = new RulePlannerAgent();
      const interview = makeInterviewFixture({ maxQuestions: 10 });
      const turns = [makeConversationTurnFixture({ answer: "one" })];

      const decision = await planner.decideNextAction(interview, null, turns, null);

      expect(decision.action).toBe("ASK_QUESTION");

    });

  });

  describe("early wrap-up on consistent struggle", () => {

    it("wraps up early after 3 consecutive very low scores, even under budget", async () => {

      const planner = new RulePlannerAgent();
      const interview = makeInterviewFixture({ maxQuestions: 10 });

      const turns = [
        makeConversationTurnFixture({ answer: "one" }),
        makeConversationTurnFixture({ answer: "two" }),
        makeConversationTurnFixture({ answer: "three" }),
      ];

      const context = makeInterviewContextFixture({
        answerQualityHistory: [15, 10, 5],
      });

      const decision = await planner.decideNextAction(interview, context, turns);

      expect(decision.action).toBe("WRAP_UP");
      expect(decision.reason).toContain("early");

    });

    it("does not wrap up early before the minimum question count, even with low scores", async () => {

      const planner = new RulePlannerAgent();
      const interview = makeInterviewFixture({ maxQuestions: 10 });

      const turns = [makeConversationTurnFixture({ answer: "one" })];

      const context = makeInterviewContextFixture({
        answerQualityHistory: [5],
      });

      const decision = await planner.decideNextAction(interview, context, turns);

      expect(decision.action).toBe("ASK_QUESTION");

    });

    it("does not wrap up early on one bad score mixed with decent ones", async () => {

      const planner = new RulePlannerAgent();
      const interview = makeInterviewFixture({ maxQuestions: 10 });

      const turns = [
        makeConversationTurnFixture({ answer: "one" }),
        makeConversationTurnFixture({ answer: "two" }),
        makeConversationTurnFixture({ answer: "three" }),
      ];

      const context = makeInterviewContextFixture({
        answerQualityHistory: [80, 70, 10],
      });

      const decision = await planner.decideNextAction(interview, context, turns);

      expect(decision.action).toBe("ASK_QUESTION");

    });

    it("still checks proctoring risk first, even with a consistent struggle in progress", async () => {

      const planner = new RulePlannerAgent();
      const interview = makeInterviewFixture({ maxQuestions: 10 });

      const turns = [
        makeConversationTurnFixture({ answer: "one" }),
        makeConversationTurnFixture({ answer: "two" }),
        makeConversationTurnFixture({ answer: "three" }),
      ];

      const context = makeInterviewContextFixture({
        answerQualityHistory: [15, 10, 5],
      });

      const decision = await planner.decideNextAction(interview, context, turns, {
        riskScore: 90,
        riskLevel: "critical",
        status: "FLAGGED",
      } as never);

      expect(decision.action).toBe("WRAP_UP");
      expect(decision.reason).toContain("critical risk");

    });

  });

});
