import { describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";

import { InterviewOrchestrator } from "../../../modules/orchestrator/services/InterviewOrchestrator";
import { ConversationRole, ConversationStatus } from "../../../modules/conversation/types/conversation.types";

import {
  makeConversationTurnFixture,
  makeInterviewContextFixture,
  makeInterviewFixture,
} from "../../fixtures/agentFixtures";

function makeFakeInterviewSessionService(interview = makeInterviewFixture()) {
  return {
    getSessionById: vi.fn().mockResolvedValue(interview),
    completeSession: vi.fn().mockResolvedValue(interview),
  };
}

function makeFakeConversationService() {
  return {
    getConversationHistory: vi.fn().mockResolvedValue([]),
    createTurn: vi.fn().mockImplementation((dto) =>
      Promise.resolve(
        makeConversationTurnFixture({
          turnNumber: dto.turnNumber,
          question: dto.question,
          metadata: dto.metadata,
        })
      )
    ),
    updateAnswer: vi.fn().mockImplementation((id, answer) =>
      Promise.resolve(
        makeConversationTurnFixture({
          id,
          answer,
          turnNumber: 1,
          question: "What is a closure?",
          metadata: { topic: "javascript", difficulty: "BEGINNER" },
        })
      )
    ),
  };
}

function makeFakeInterviewContextService(
  context = makeInterviewContextFixture()
) {
  return {
    getOrCreate: vi.fn().mockResolvedValue(context),
    appendTurn: vi.fn().mockResolvedValue({
      ...context,
      topicsCovered: ["javascript"],
      transcriptSummary: "updated summary",
    }),
  };
}

function makeFakeEvaluationService() {
  return {
    getEvaluationByInterview: vi.fn().mockResolvedValue(null),
    createEvaluation: vi.fn().mockResolvedValue({ id: "eval-1" }),
    generateEvaluation: vi.fn().mockResolvedValue({
      id: "eval-1",
      overallScore: 80,
      overallSummary: "Solid candidate.",
    }),
  };
}

function makeFakePlanner(action: "ASK_QUESTION" | "WRAP_UP" = "ASK_QUESTION") {
  return {
    decideNextAction: vi.fn().mockResolvedValue({ action, reason: "test" }),
  };
}

function makeFakeProctoringSessionRepository(
  session: { riskScore: number; status: string } | null = null
) {
  return {
    findByInterviewSession: vi.fn().mockResolvedValue(session),
  };
}

function makeFakeQuestionAgent(behavior: "succeed" | "fail" = "succeed") {
  return {
    generateNextQuestion: vi.fn().mockImplementation(() =>
      behavior === "succeed"
        ? Promise.resolve({
            question: "Real agent question",
            difficulty: "INTERMEDIATE",
            isFollowUp: false,
            topic: "javascript",
            rationale: "because",
          })
        : Promise.reject(new Error("question agent exploded"))
    ),
  };
}

function makeFakeConversationAgent(behavior: "succeed" | "fail" = "succeed") {
  return {
    summarizeTurn: vi.fn().mockImplementation(() =>
      behavior === "succeed"
        ? Promise.resolve({ summary: "real summary", newTopics: ["react"], answerQuality: 88 })
        : Promise.reject(new Error("conversation agent exploded"))
    ),
  };
}

describe("InterviewOrchestrator.getNextQuestion", () => {

  it("rejects getting the next question when the interview is not IN_PROGRESS", async () => {

    const completedInterview = makeInterviewFixture({ status: "COMPLETED" as never });

    const orchestrator = new InterviewOrchestrator(
      makeFakeInterviewSessionService(completedInterview) as never,
      makeFakeConversationService() as never,
      makeFakeInterviewContextService() as never,
      makeFakeEvaluationService() as never,
      makeFakeQuestionAgent() as never,
      makeFakeConversationAgent() as never,
      makeFakePlanner() as never
    );

    await expect(
      orchestrator.getNextQuestion("session-1", "user-1")
    ).rejects.toThrow();

  });

  it("returns done:true when the planner decides to wrap up", async () => {

    const orchestrator = new InterviewOrchestrator(
      makeFakeInterviewSessionService() as never,
      makeFakeConversationService() as never,
      makeFakeInterviewContextService() as never,
      makeFakeEvaluationService() as never,
      makeFakeQuestionAgent() as never,
      makeFakeConversationAgent() as never,
      makeFakePlanner("WRAP_UP") as never
    );

    const result = await orchestrator.getNextQuestion("session-1", "user-1");

    expect(result.done).toBe(true);
    expect(result.turn).toBeUndefined();

  });

  it("passes a proctoring risk summary to the planner when a session exists", async () => {

    const planner = makeFakePlanner();
    const proctoringRepo = makeFakeProctoringSessionRepository({
      riskScore: 80,
      status: "FLAGGED",
    });

    const orchestrator = new InterviewOrchestrator(
      makeFakeInterviewSessionService() as never,
      makeFakeConversationService() as never,
      makeFakeInterviewContextService() as never,
      makeFakeEvaluationService() as never,
      makeFakeQuestionAgent() as never,
      makeFakeConversationAgent() as never,
      planner as never,
      proctoringRepo as never
    );

    await orchestrator.getNextQuestion("session-1", "user-1");

    expect(proctoringRepo.findByInterviewSession).toHaveBeenCalledWith("session-1");
    expect(planner.decideNextAction).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ riskScore: 80, riskLevel: "critical", status: "FLAGGED" })
    );

  });

  it("passes null to the planner when there's no proctoring session, without throwing", async () => {

    const planner = makeFakePlanner();
    const proctoringRepo = makeFakeProctoringSessionRepository(null);

    const orchestrator = new InterviewOrchestrator(
      makeFakeInterviewSessionService() as never,
      makeFakeConversationService() as never,
      makeFakeInterviewContextService() as never,
      makeFakeEvaluationService() as never,
      makeFakeQuestionAgent() as never,
      makeFakeConversationAgent() as never,
      planner as never,
      proctoringRepo as never
    );

    await orchestrator.getNextQuestion("session-1", "user-1");

    expect(planner.decideNextAction).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      null
    );

  });

  it("degrades to null (not a throw) when the proctoring lookup itself fails", async () => {

    const planner = makeFakePlanner();
    const proctoringRepo = {
      findByInterviewSession: vi.fn().mockRejectedValue(new Error("db down")),
    };

    const orchestrator = new InterviewOrchestrator(
      makeFakeInterviewSessionService() as never,
      makeFakeConversationService() as never,
      makeFakeInterviewContextService() as never,
      makeFakeEvaluationService() as never,
      makeFakeQuestionAgent() as never,
      makeFakeConversationAgent() as never,
      planner as never,
      proctoringRepo as never
    );

    const result = await orchestrator.getNextQuestion("session-1", "user-1");

    expect(result).toBeDefined();
    expect(planner.decideNextAction).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      null
    );

  });

  it("creates a turn from the real question agent when the planner says continue", async () => {

    const conversationService = makeFakeConversationService();

    const orchestrator = new InterviewOrchestrator(
      makeFakeInterviewSessionService() as never,
      conversationService as never,
      makeFakeInterviewContextService() as never,
      makeFakeEvaluationService() as never,
      makeFakeQuestionAgent("succeed") as never,
      makeFakeConversationAgent() as never,
      makeFakePlanner("ASK_QUESTION") as never
    );

    const result = await orchestrator.getNextQuestion("session-1", "user-1");

    expect(result.done).toBe(false);
    expect(result.turn?.question).toBe("Real agent question");
    expect(conversationService.createTurn).toHaveBeenCalledWith(
      expect.objectContaining({
        role: ConversationRole.AI,
        status: ConversationStatus.PENDING,
        question: "Real agent question",
      })
    );

  });

  it("falls back to the deterministic mock question agent if the real one throws", async () => {

    const conversationService = makeFakeConversationService();

    const orchestrator = new InterviewOrchestrator(
      makeFakeInterviewSessionService() as never,
      conversationService as never,
      makeFakeInterviewContextService() as never,
      makeFakeEvaluationService() as never,
      makeFakeQuestionAgent("fail") as never,
      makeFakeConversationAgent() as never,
      makeFakePlanner("ASK_QUESTION") as never
    );

    const result = await orchestrator.getNextQuestion("session-1", "user-1");

    // Should not throw, and should still produce a real turn via the
    // orchestrator's internal fallback MockQuestionAgent.
    expect(result.done).toBe(false);
    expect(result.turn?.question).toBeTruthy();
    expect(conversationService.createTurn).toHaveBeenCalledTimes(1);

  });

});

describe("InterviewOrchestrator.submitAnswer", () => {

  it("updates the context with the real conversation agent's summary and topics", async () => {

    const contextService = makeFakeInterviewContextService();

    const orchestrator = new InterviewOrchestrator(
      makeFakeInterviewSessionService() as never,
      makeFakeConversationService() as never,
      contextService as never,
      makeFakeEvaluationService() as never,
      makeFakeQuestionAgent() as never,
      makeFakeConversationAgent("succeed") as never,
      makeFakePlanner() as never
    );

    const result = await orchestrator.submitAnswer(
      "turn-1",
      "A function with its lexical scope.",
      30,
      "session-1",
      "user-1"
    );

    expect(contextService.appendTurn).toHaveBeenCalledWith(
      "session-1",
      expect.objectContaining({
        transcriptSummary: "real summary",
        newTopics: expect.arrayContaining(["react", "javascript"]),
        answerQuality: 88,
      })
    );
    expect(result.topicsCovered).toEqual(["javascript"]);

  });

  it("rejects submitting an answer when the interview is not IN_PROGRESS", async () => {

    const pausedInterview = makeInterviewFixture({ status: "PAUSED" as never });

    const orchestrator = new InterviewOrchestrator(
      makeFakeInterviewSessionService(pausedInterview) as never,
      makeFakeConversationService() as never,
      makeFakeInterviewContextService() as never,
      makeFakeEvaluationService() as never,
      makeFakeQuestionAgent() as never,
      makeFakeConversationAgent() as never,
      makeFakePlanner() as never
    );

    await expect(
      orchestrator.submitAnswer("turn-1", "some answer", 30, "session-1", "user-1")
    ).rejects.toThrow();

  });

  it("falls back to the mock conversation agent if the real one throws", async () => {

    const contextService = makeFakeInterviewContextService();

    const orchestrator = new InterviewOrchestrator(
      makeFakeInterviewSessionService() as never,
      makeFakeConversationService() as never,
      contextService as never,
      makeFakeEvaluationService() as never,
      makeFakeQuestionAgent() as never,
      makeFakeConversationAgent("fail") as never,
      makeFakePlanner() as never
    );

    // Should not throw despite the real conversation agent rejecting.
    await expect(
      orchestrator.submitAnswer("turn-1", "some answer", undefined, "session-1", "user-1")
    ).resolves.toBeDefined();

  });

});

describe("InterviewOrchestrator.finishInterview", () => {

  it("creates a new evaluation when none exists yet, then generates and completes the session", async () => {

    const evaluationService = makeFakeEvaluationService();
    const sessionService = makeFakeInterviewSessionService();

    const orchestrator = new InterviewOrchestrator(
      sessionService as never,
      makeFakeConversationService() as never,
      makeFakeInterviewContextService() as never,
      evaluationService as never,
      makeFakeQuestionAgent() as never,
      makeFakeConversationAgent() as never,
      makeFakePlanner() as never
    );

    const sessionId = new Types.ObjectId().toString();
    const userId = new Types.ObjectId().toString();

    const result = await orchestrator.finishInterview(sessionId, userId, 900);

    expect(evaluationService.createEvaluation).toHaveBeenCalledTimes(1);
    expect(evaluationService.generateEvaluation).toHaveBeenCalledWith("eval-1");
    expect(sessionService.completeSession).toHaveBeenCalledWith(
      sessionId,
      userId,
      80,
      "Solid candidate.",
      900
    );
    expect(result.overallScore).toBe(80);

  });

  it("reuses an existing evaluation instead of creating a duplicate", async () => {

    const evaluationService = makeFakeEvaluationService();
    evaluationService.getEvaluationByInterview.mockResolvedValue({
      id: "existing-eval",
    });

    const orchestrator = new InterviewOrchestrator(
      makeFakeInterviewSessionService() as never,
      makeFakeConversationService() as never,
      makeFakeInterviewContextService() as never,
      evaluationService as never,
      makeFakeQuestionAgent() as never,
      makeFakeConversationAgent() as never,
      makeFakePlanner() as never
    );

    const sessionId = new Types.ObjectId().toString();
    const userId = new Types.ObjectId().toString();

    await orchestrator.finishInterview(sessionId, userId, 900);

    expect(evaluationService.createEvaluation).not.toHaveBeenCalled();
    expect(evaluationService.generateEvaluation).toHaveBeenCalledWith(
      "existing-eval"
    );

  });

  it("rejects an invalid session id before calling any service", async () => {

    const evaluationService = makeFakeEvaluationService();

    const orchestrator = new InterviewOrchestrator(
      makeFakeInterviewSessionService() as never,
      makeFakeConversationService() as never,
      makeFakeInterviewContextService() as never,
      evaluationService as never,
      makeFakeQuestionAgent() as never,
      makeFakeConversationAgent() as never,
      makeFakePlanner() as never
    );

    await expect(
      orchestrator.finishInterview("not-an-object-id", "user-1", 900)
    ).rejects.toThrow();

    expect(evaluationService.getEvaluationByInterview).not.toHaveBeenCalled();

  });

});
