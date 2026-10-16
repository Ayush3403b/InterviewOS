import { Types } from "mongoose";

import { BaseService } from "../../../shared/services/BaseService";
import { ApiError } from "../../../shared/errors/ApiError";
import { ErrorCode } from "../../../shared/errors/ErrorCode";

import { CoachingPlanRepository } from "../repositories/CoachingPlanRepository";
import { CoachingPlanDocument } from "../types/coach.types";

import { ICoachAgent } from "../../../agents/coach/ICoachAgent";

import EvaluationService from "../../evaluation/services/EvaluationService";
import InterviewSessionService from "../../interview-session/services/InterviewSessionService";

export default class CoachService extends BaseService<CoachingPlanRepository> {
  constructor(
    repository: CoachingPlanRepository,
    private readonly coachAgent: ICoachAgent,
    private readonly evaluationService: EvaluationService,
    private readonly interviewSessionService: InterviewSessionService
  ) {
    super(repository);
  }

  private ensureValidObjectId(id: string, label: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(400, `Invalid ${label}.`, ErrorCode.BAD_REQUEST);
    }
  }

  /**
   * Generates a coaching plan the first time this interview's
   * evaluation is coached, and simply returns the existing plan on
   * every subsequent call - same reuse-don't-regenerate pattern the
   * orchestrator uses for evaluations.
   */
  async generateForInterview(
    interviewSessionId: string,
    userId: string
  ): Promise<CoachingPlanDocument> {
    this.ensureValidObjectId(interviewSessionId, "interview session id");
    this.ensureValidObjectId(userId, "user id");

    // Throws if the interview doesn't exist or isn't owned by this user.
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

    const existing = await this.repository.findByInterviewSession(
      interviewSessionId
    );

    if (existing) {
      return existing;
    }

    const plan = await this.coachAgent.generateCoaching({
      overallScore: evaluation.overallScore,
      skillScores: evaluation.skillScores,
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      overallSummary: evaluation.overallSummary,
      hiringRecommendation: evaluation.hiringRecommendation,
      interviewType: interview.type,
      interviewLevel: interview.level,
    });

    const saved = await this.repository.upsertForInterview(
      new Types.ObjectId(interviewSessionId),
      new Types.ObjectId(userId),
      evaluation._id as Types.ObjectId,
      plan
    );

    if (!saved) {
      throw new ApiError(
        500,
        "Failed to store the coaching plan.",
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }

    return saved;
  }

  async getForInterview(
    interviewSessionId: string,
    userId: string
  ): Promise<CoachingPlanDocument | null> {
    this.ensureValidObjectId(interviewSessionId, "interview session id");

    // Ownership check - throws if this user doesn't own the interview.
    await this.interviewSessionService.getSessionById(
      interviewSessionId,
      userId
    );

    return this.repository.findByInterviewSession(interviewSessionId);
  }
}
