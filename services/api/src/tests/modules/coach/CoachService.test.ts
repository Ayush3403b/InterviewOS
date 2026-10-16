import { describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";

import CoachService from "../../../modules/coach/services/CoachService";
import { ApiError } from "../../../shared/errors/ApiError";

function makeFakeRepository() {
  return {
    findByInterviewSession: vi.fn(),
    upsertForInterview: vi.fn(),
  };
}

function makeFakeCoachAgent() {
  return {
    generateCoaching: vi.fn().mockResolvedValue({
      personalizedFeedback: "Great job overall.",
      weakTopics: ["Confidence"],
      learningRoadmap: [{ topic: "Confidence", action: "Practice", priority: "MEDIUM" }],
      recommendedResources: [{ title: "Mocks", type: "PRACTICE", reason: "Helps" }],
      careerGuidance: "Keep going.",
    }),
  };
}

function makeFakeEvaluationService(evaluation: unknown = defaultEvaluation()) {
  return {
    getEvaluationByInterview: vi.fn().mockResolvedValue(evaluation),
  };
}

function defaultEvaluation() {
  return {
    _id: new Types.ObjectId(),
    overallScore: 80,
    skillScores: { technical: 80, communication: 80, problemSolving: 80, confidence: 80 },
    strengths: ["Good"],
    weaknesses: ["Nervous"],
    overallSummary: "Solid.",
    hiringRecommendation: "HIRE",
  };
}

function makeFakeInterviewSessionService() {
  return {
    getSessionById: vi.fn().mockResolvedValue({
      type: "TECHNICAL",
      level: "INTERMEDIATE",
    }),
  };
}

const sessionId = new Types.ObjectId().toString();
const userId = new Types.ObjectId().toString();

describe("CoachService.generateForInterview", () => {

  it("throws if the interview has no evaluation yet", async () => {

    const evaluationService = makeFakeEvaluationService(null);
    const repository = makeFakeRepository();

    const service = new CoachService(
      repository as never,
      makeFakeCoachAgent() as never,
      evaluationService as never,
      makeFakeInterviewSessionService() as never
    );

    await expect(
      service.generateForInterview(sessionId, userId)
    ).rejects.toThrow(ApiError);

    expect(repository.upsertForInterview).not.toHaveBeenCalled();

  });

  it("returns the existing plan instead of regenerating one", async () => {

    const repository = makeFakeRepository();
    repository.findByInterviewSession.mockResolvedValue({ id: "existing-plan" });

    const coachAgent = makeFakeCoachAgent();

    const service = new CoachService(
      repository as never,
      coachAgent as never,
      makeFakeEvaluationService() as never,
      makeFakeInterviewSessionService() as never
    );

    const result = await service.generateForInterview(sessionId, userId);

    expect(result).toEqual({ id: "existing-plan" });
    expect(coachAgent.generateCoaching).not.toHaveBeenCalled();
    expect(repository.upsertForInterview).not.toHaveBeenCalled();

  });

  it("generates and persists a new plan when none exists yet", async () => {

    const repository = makeFakeRepository();
    repository.findByInterviewSession.mockResolvedValue(null);
    repository.upsertForInterview.mockResolvedValue({ id: "new-plan" });

    const coachAgent = makeFakeCoachAgent();
    const interviewSessionService = makeFakeInterviewSessionService();

    const service = new CoachService(
      repository as never,
      coachAgent as never,
      makeFakeEvaluationService() as never,
      interviewSessionService as never
    );

    const result = await service.generateForInterview(sessionId, userId);

    expect(coachAgent.generateCoaching).toHaveBeenCalledWith(
      expect.objectContaining({
        overallScore: 80,
        interviewType: "TECHNICAL",
        interviewLevel: "INTERMEDIATE",
      })
    );
    expect(result).toEqual({ id: "new-plan" });

  });

  it("rejects an invalid session id before calling any service", async () => {

    const evaluationService = makeFakeEvaluationService();

    const service = new CoachService(
      makeFakeRepository() as never,
      makeFakeCoachAgent() as never,
      evaluationService as never,
      makeFakeInterviewSessionService() as never
    );

    await expect(
      service.generateForInterview("not-an-object-id", userId)
    ).rejects.toThrow(ApiError);

    expect(evaluationService.getEvaluationByInterview).not.toHaveBeenCalled();

  });

});

describe("CoachService.getForInterview", () => {

  it("checks ownership via interviewSessionService before returning a plan", async () => {

    const repository = makeFakeRepository();
    repository.findByInterviewSession.mockResolvedValue({ id: "plan-1" });

    const interviewSessionService = makeFakeInterviewSessionService();

    const service = new CoachService(
      repository as never,
      makeFakeCoachAgent() as never,
      makeFakeEvaluationService() as never,
      interviewSessionService as never
    );

    const result = await service.getForInterview(sessionId, userId);

    expect(interviewSessionService.getSessionById).toHaveBeenCalledWith(
      sessionId,
      userId
    );
    expect(result).toEqual({ id: "plan-1" });

  });

  it("returns null when no plan exists yet, without throwing", async () => {

    const repository = makeFakeRepository();
    repository.findByInterviewSession.mockResolvedValue(null);

    const service = new CoachService(
      repository as never,
      makeFakeCoachAgent() as never,
      makeFakeEvaluationService() as never,
      makeFakeInterviewSessionService() as never
    );

    const result = await service.getForInterview(sessionId, userId);

    expect(result).toBeNull();

  });

});
