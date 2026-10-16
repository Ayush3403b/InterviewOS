import { describe, it, expect, beforeEach, vi } from "vitest";
import { Types } from "mongoose";

import ReportService from "../../../modules/report/services/ReportService";
import { ReportRepository } from "../../../modules/report/repositories/ReportRepository";

describe("ReportService - Share Link Management", () => {
  let repository: ReportRepository;
  let service: ReportService;

  const mockReportAgent: any = {
    generateNarrative: vi.fn(),
  };
  const mockEvaluationService: any = {
    getEvaluationByInterview: vi.fn(),
  };
  const mockInterviewSessionService: any = {
    getSessionById: vi.fn(),
  };
  const mockCoachService: any = {
    getForInterview: vi.fn(),
  };
  const mockUserService: any = {
    getUserById: vi.fn(),
  };

  const sessionId = new Types.ObjectId().toString();
  const userId = new Types.ObjectId().toString();

  const fakeReport: any = {
    _id: new Types.ObjectId(),
    interviewSessionId: new Types.ObjectId(sessionId),
    userId: new Types.ObjectId(userId),
    candidateName: "John Doe",
    interviewTitle: "Frontend Architect",
    overallScore: 85,
    isPublic: false,
    shareToken: undefined,
  };

  beforeEach(() => {
    repository = new ReportRepository();
    vi.spyOn(repository, "findByInterviewSession").mockResolvedValue(fakeReport);
    vi.spyOn(repository, "setShareToken").mockResolvedValue({
      ...fakeReport,
      isPublic: true,
      shareToken: "rep_mock12345",
    });
    vi.spyOn(repository, "revokeShareToken").mockResolvedValue({
      ...fakeReport,
      isPublic: false,
      shareToken: undefined,
    });
    vi.spyOn(repository, "findByShareToken").mockImplementation(async (token: string) => {
      if (token === "rep_mock12345") {
        return { ...fakeReport, isPublic: true, shareToken: token } as any;
      }
      return null;
    });

    service = new ReportService(
      repository,
      mockReportAgent,
      mockEvaluationService,
      mockInterviewSessionService,
      mockCoachService,
      mockUserService
    );
  });

  it("creates a share token with default 30 days expiry", async () => {
    const result = await service.createShareLink(sessionId, userId, 30);

    expect(result.shareToken).toBeDefined();
    expect(result.shareUrl).toContain("/report/share/");
    expect(repository.setShareToken).toHaveBeenCalled();
  });

  it("revokes an active share link", async () => {
    await service.revokeShareLink(sessionId, userId);
    expect(repository.revokeShareToken).toHaveBeenCalledWith(sessionId);
  });

  it("resolves a report by valid share token", async () => {
    const report = await service.getByShareToken("rep_mock12345");
    expect(report).toBeDefined();
    expect(report.candidateName).toBe("John Doe");
  });

  it("throws 404 if share token is invalid or expired", async () => {
    await expect(service.getByShareToken("rep_nonexistent")).rejects.toThrow(
      "This shared interview report is expired, revoked, or not found."
    );
  });
});
