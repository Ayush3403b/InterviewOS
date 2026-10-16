import { Types } from "mongoose";

import { BaseService } from "../../../shared/services/BaseService";
import { ApiError } from "../../../shared/errors/ApiError";
import { ErrorCode } from "../../../shared/errors/ErrorCode";

import { ReportRepository } from "../repositories/ReportRepository";
import { ReportDocument } from "../types/report.types";

import { IReportAgent } from "../../../agents/report/IReportAgent";
import { buildReportPdf } from "../../../shared/pdf/buildReportPdf";

import EvaluationService from "../../evaluation/services/EvaluationService";
import InterviewSessionService from "../../interview-session/services/InterviewSessionService";
import CoachService from "../../coach/services/CoachService";
import { UserService } from "../../users/services/UserService";

export default class ReportService extends BaseService<ReportRepository> {
  constructor(
    repository: ReportRepository,
    private readonly reportAgent: IReportAgent,
    private readonly evaluationService: EvaluationService,
    private readonly interviewSessionService: InterviewSessionService,
    private readonly coachService: CoachService,
    private readonly userService: UserService
  ) {
    super(repository);
  }

  private ensureValidObjectId(id: string, label: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(400, `Invalid ${label}.`, ErrorCode.BAD_REQUEST);
    }
  }

  /**
   * Snapshots the evaluation (and coaching plan, if one exists yet) into
   * a stable report record, generating once and reusing thereafter -
   * same pattern as CoachService/orchestrator evaluation reuse.
   */
  async generateForInterview(
    interviewSessionId: string,
    userId: string
  ): Promise<ReportDocument> {
    this.ensureValidObjectId(interviewSessionId, "interview session id");
    this.ensureValidObjectId(userId, "user id");

    const existing = await this.repository.findByInterviewSession(
      interviewSessionId
    );

    if (existing) {
      return existing;
    }

    const interview = await this.interviewSessionService.getSessionById(
      interviewSessionId,
      userId
    );

    const evaluation = await this.evaluationService.getEvaluationByInterview(
      interviewSessionId
    );

    if (!evaluation) {
      throw new ApiError(
        400,
        "This interview doesn't have an evaluation yet - finish the interview first.",
        ErrorCode.BAD_REQUEST
      );
    }

    const user = await this.userService.getUserById(userId);

    if (!user) {
      throw new ApiError(404, "Candidate not found.", ErrorCode.NOT_FOUND);
    }

    // Coaching is optional - a report can exist without one.
    const coachingPlan = await this.coachService.getForInterview(
      interviewSessionId,
      userId
    );

    const candidateName = `${user.firstName} ${user.lastName}`.trim();

    const narrative = await this.reportAgent.generateNarrative({
      candidateName,
      interviewTitle: interview.title,
      interviewType: interview.type,
      interviewLevel: interview.level,
      overallScore: evaluation.overallScore,
      hiringRecommendation: evaluation.hiringRecommendation,
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      weakTopics: coachingPlan?.weakTopics ?? [],
    });

    const saved = await this.repository.upsertForInterview(
      new Types.ObjectId(interviewSessionId),
      new Types.ObjectId(userId),
      {
        evaluationId: evaluation._id as Types.ObjectId,
        candidateName,
        interviewTitle: interview.title,
        interviewType: interview.type,
        interviewLevel: interview.level,
        overallScore: evaluation.overallScore,
        skillScores: evaluation.skillScores,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
        hiringRecommendation: evaluation.hiringRecommendation,
        overallSummary: evaluation.overallSummary,
        questionEvaluations: evaluation.questionEvaluations,
        weakTopics: coachingPlan?.weakTopics ?? [],
        learningRoadmap: coachingPlan?.learningRoadmap ?? [],
        recommendedResources: coachingPlan?.recommendedResources ?? [],
        skillGaps: evaluation.skillGaps ?? [],
        executiveSummary: narrative.executiveSummary,
        candidateFeedback: narrative.candidateFeedback,
        recruiterBrief: narrative.recruiterBrief,
        executiveDigest: narrative.executiveDigest,
      }
    );

    if (!saved) {
      throw new ApiError(
        500,
        "Failed to store the report.",
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }

    return saved;
  }

  async getForInterview(
    interviewSessionId: string,
    userId: string
  ): Promise<ReportDocument | null> {
    this.ensureValidObjectId(interviewSessionId, "interview session id");

    // Ownership check - throws if this user doesn't own the interview.
    await this.interviewSessionService.getSessionById(
      interviewSessionId,
      userId
    );

    return this.repository.findByInterviewSession(interviewSessionId);
  }

  async getPdf(
    interviewSessionId: string,
    userId: string
  ): Promise<Buffer> {
    const report = await this.getForInterview(interviewSessionId, userId);

    if (!report) {
      throw new ApiError(
        400,
        "No report exists for this interview yet - generate it first.",
        ErrorCode.BAD_REQUEST
      );
    }

    return buildReportPdf(report);
  }

  async createShareLink(
    interviewSessionId: string,
    userId: string,
    expiresInDays = 30
  ): Promise<{ shareToken: string; shareUrl: string; shareExpiresAt?: Date }> {
    const report = await this.getForInterview(interviewSessionId, userId);

    if (!report) {
      throw new ApiError(
        400,
        "No report exists for this interview yet - generate it first.",
        ErrorCode.BAD_REQUEST
      );
    }

    let token = report.shareToken;
    let expiresAt = report.shareExpiresAt;

    if (!token || !report.isPublic || (expiresAt && expiresAt < new Date())) {
      const crypto = await import("crypto");
      token = `rep_${crypto.randomBytes(16).toString("hex")}`;
      expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

      await this.repository.setShareToken(interviewSessionId, token, expiresAt);
    }

    return {
      shareToken: token,
      shareUrl: `/report/share/${token}`,
      shareExpiresAt: expiresAt,
    };
  }

  async revokeShareLink(
    interviewSessionId: string,
    userId: string
  ): Promise<void> {
    await this.getForInterview(interviewSessionId, userId);
    await this.repository.revokeShareToken(interviewSessionId);
  }

  async getByShareToken(shareToken: string): Promise<ReportDocument> {
    if (!shareToken || typeof shareToken !== "string") {
      throw new ApiError(400, "Invalid share token.", ErrorCode.BAD_REQUEST);
    }

    const report = await this.repository.findByShareToken(shareToken);

    if (!report) {
      throw new ApiError(
        404,
        "This shared interview report is expired, revoked, or not found.",
        ErrorCode.NOT_FOUND
      );
    }

    return report;
  }
}
