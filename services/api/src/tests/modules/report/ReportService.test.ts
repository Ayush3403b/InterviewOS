import { describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";

import ReportService from "../../../modules/report/services/ReportService";
import { ApiError } from "../../../shared/errors/ApiError";

function makeFakeRepository() {
  return {
    findByInterviewSession: vi.fn(),
    upsertForInterview: vi.fn(),
  };
}

function makeFakeReportAgent() {
  return {
    generateNarrative: vi.fn().mockResolvedValue({
      executiveSummary: "Great candidate overall.",
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
    overallScore: 82,
    skillScores: { technical: 85, communication: 80, problemSolving: 82, confidence: 80 },
    strengths: ["Good"],
    weaknesses: ["Nervous"],
    overallSummary: "Solid.",
    hiringRecommendation: "HIRE",
    questionEvaluations: [],
  };
}

function makeFakeInterviewSessionService() {
  return {
    getSessionById: vi.fn().mockResolvedValue({
      title: "Backend Engineer Interview",
      type: "TECHNICAL",
      level: "INTERMEDIATE",
    }),
  };
}

function makeFakeCoachService(plan: unknown = null) {
  return {
    getForInterview: vi.fn().mockResolvedValue(plan),
  };
}

function makeFakeUserService(user: unknown = { firstName: "Jordan", lastName: "Lee" }) {
  return {
    getUserById: vi.fn().mockResolvedValue(user),
  };
}

const sessionId = new Types.ObjectId().toString();
const userId = new Types.ObjectId().toString();

function buildService(overrides: Partial<{
  repository: ReturnType<typeof makeFakeRepository>;
  reportAgent: ReturnType<typeof makeFakeReportAgent>;
  evaluationService: ReturnType<typeof makeFakeEvaluationService>;
  interviewSessionService: ReturnType<typeof makeFakeInterviewSessionService>;
  coachService: ReturnType<typeof makeFakeCoachService>;
  userService: ReturnType<typeof makeFakeUserService>;
}> = {}) {
  return new ReportService(
    (overrides.repository ?? makeFakeRepository()) as never,
    (overrides.reportAgent ?? makeFakeReportAgent()) as never,
    (overrides.evaluationService ?? makeFakeEvaluationService()) as never,
    (overrides.interviewSessionService ?? makeFakeInterviewSessionService()) as never,
    (overrides.coachService ?? makeFakeCoachService()) as never,
    (overrides.userService ?? makeFakeUserService()) as never
  );
}

describe("ReportService.generateForInterview", () => {

  it("returns the existing report instead of regenerating one", async () => {

    const repository = makeFakeRepository();
    repository.findByInterviewSession.mockResolvedValue({ id: "existing-report" });

    const reportAgent = makeFakeReportAgent();
    const service = buildService({ repository, reportAgent });

    const result = await service.generateForInterview(sessionId, userId);

    expect(result).toEqual({ id: "existing-report" });
    expect(reportAgent.generateNarrative).not.toHaveBeenCalled();

  });

  it("throws if the interview has no evaluation yet", async () => {

    const repository = makeFakeRepository();
    repository.findByInterviewSession.mockResolvedValue(null);

    const evaluationService = makeFakeEvaluationService(null);

    const service = buildService({ repository, evaluationService });

    await expect(
      service.generateForInterview(sessionId, userId)
    ).rejects.toThrow(ApiError);

  });

  it("generates a report using an empty weakTopics list when no coaching plan exists yet", async () => {

    const repository = makeFakeRepository();
    repository.findByInterviewSession.mockResolvedValue(null);
    repository.upsertForInterview.mockResolvedValue({ id: "new-report" });

    const reportAgent = makeFakeReportAgent();
    const coachService = makeFakeCoachService(null);

    const service = buildService({ repository, reportAgent, coachService });

    const result = await service.generateForInterview(sessionId, userId);

    expect(reportAgent.generateNarrative).toHaveBeenCalledWith(
      expect.objectContaining({ weakTopics: [] })
    );
    expect(result).toEqual({ id: "new-report" });

  });

  it("includes the coaching plan's weakTopics/roadmap/resources when one exists", async () => {

    const repository = makeFakeRepository();
    repository.findByInterviewSession.mockResolvedValue(null);
    repository.upsertForInterview.mockResolvedValue({ id: "new-report" });

    const coachService = makeFakeCoachService({
      weakTopics: ["System design"],
      learningRoadmap: [{ topic: "System design", action: "Study", priority: "HIGH" }],
      recommendedResources: [{ title: "Book", type: "COURSE", reason: "Helps" }],
    });

    const service = buildService({ repository, coachService });

    await service.generateForInterview(sessionId, userId);

    expect(repository.upsertForInterview).toHaveBeenCalledWith(
      expect.any(Types.ObjectId),
      expect.any(Types.ObjectId),
      expect.objectContaining({
        weakTopics: ["System design"],
        learningRoadmap: [{ topic: "System design", action: "Study", priority: "HIGH" }],
      })
    );

  });

  it("rejects an invalid session id before calling any service", async () => {

    const evaluationService = makeFakeEvaluationService();
    const service = buildService({ evaluationService });

    await expect(
      service.generateForInterview("not-an-object-id", userId)
    ).rejects.toThrow(ApiError);

    expect(evaluationService.getEvaluationByInterview).not.toHaveBeenCalled();

  });

});

describe("ReportService.getPdf", () => {

  it("throws if no report exists yet", async () => {

    const repository = makeFakeRepository();
    repository.findByInterviewSession.mockResolvedValue(null);

    const service = buildService({ repository });

    await expect(service.getPdf(sessionId, userId)).rejects.toThrow(ApiError);

  });

});
