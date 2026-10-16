import { describe, expect, it } from "vitest";

import { MockQuestionAgent } from "../../../agents/question/MockQuestionAgent";
import { InterviewType, InterviewLevel } from "../../../modules/interview-session/types/interview-session.types";

import { makeInterviewContextFixture, makeInterviewFixture } from "../../fixtures/agentFixtures";

describe("MockQuestionAgent", () => {

  it("returns a question matching the interview's type and level", async () => {

    const agent = new MockQuestionAgent();
    const interview = makeInterviewFixture({ type: InterviewType.BEHAVIORAL });

    const result = await agent.generateNextQuestion(interview, null, []);

    expect(result.question).toBeTruthy();
    expect(result.topic).toBe(InterviewType.BEHAVIORAL);
    expect(result.difficulty).toBe(interview.level);
    expect(result.isFollowUp).toBe(false);

  });

  it("cycles through the pool as previousTurns grows, never erroring past pool length", async () => {

    const agent = new MockQuestionAgent();
    const interview = makeInterviewFixture({ type: InterviewType.TECHNICAL });

    const questions = new Set<string>();

    for (let i = 0; i < 8; i++) {
      const turns = Array.from({ length: i }, () =>
        ({ question: "x" }) as never
      );

      const result = await agent.generateNextQuestion(
        interview,
        null,
        turns
      );

      questions.add(result.question);
    }

    // 8 calls over a 5-item pool should wrap around, not throw.
    expect(questions.size).toBeGreaterThan(0);
    expect(questions.size).toBeLessThanOrEqual(5);

  });

  it("escalates difficulty when the context shows a strong last answer", async () => {

    const agent = new MockQuestionAgent();
    const interview = makeInterviewFixture({ level: InterviewLevel.INTERMEDIATE });
    const context = makeInterviewContextFixture({
      difficultyHistory: ["INTERMEDIATE"],
      answerQualityHistory: [85],
    });

    const result = await agent.generateNextQuestion(interview, context, []);

    expect(result.difficulty).toBe("ADVANCED");

  });

  it("eases off difficulty when the context shows a weak last answer", async () => {

    const agent = new MockQuestionAgent();
    const interview = makeInterviewFixture({ level: InterviewLevel.INTERMEDIATE });
    const context = makeInterviewContextFixture({
      difficultyHistory: ["INTERMEDIATE"],
      answerQualityHistory: [15],
    });

    const result = await agent.generateNextQuestion(interview, context, []);

    expect(result.difficulty).toBe("BEGINNER");

  });

  it("falls back to the interview's base level with no context", async () => {

    const agent = new MockQuestionAgent();
    const interview = makeInterviewFixture({ level: InterviewLevel.ADVANCED });

    const result = await agent.generateNextQuestion(interview, null, []);

    expect(result.difficulty).toBe(InterviewLevel.ADVANCED);

  });

});
