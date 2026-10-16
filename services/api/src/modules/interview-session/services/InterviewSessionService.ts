import { Types } from "mongoose";

import { ApiError } from "../../../shared/errors/ApiError";
import { ErrorCode } from "../../../shared/errors/ErrorCode";
import { BaseService } from "../../../shared/services/BaseService";

import { env } from "../../../config/env";

import { InterviewSessionRepository } from "../repositories/InterviewSessionRepository";

import { CreateInterviewSessionDto } from "../dtos/CreateInterviewSessionDto";
import { UpdateInterviewSessionDto } from "../dtos/UpdateInterviewSessionDto";

import {
  InterviewSessionDocument,
  InterviewStatus,
} from "../types/interview-session.types";

export default class InterviewSessionService extends BaseService<InterviewSessionRepository> {
  constructor(repository: InterviewSessionRepository) {
    super(repository);
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Helpers                              */
  /* -------------------------------------------------------------------------- */

  /**
   * Validate Mongo ObjectId
   */
  private ensureValidObjectId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(
        400,
        "Invalid resource id.",
        ErrorCode.BAD_REQUEST
      );
    }
  }

  /**
   * Whether an IN_PROGRESS/PAUSED interview has gone stale long
   * enough to auto-expire - see InterviewStatus.EXPIRED's doc comment.
   */
  private isStale(interview: InterviewSessionDocument): boolean {
    const ageMs = Date.now() - interview.updatedAt.getTime();

    if (interview.status === InterviewStatus.IN_PROGRESS) {
      return ageMs > env.INTERVIEW_IN_PROGRESS_TIMEOUT_MINUTES * 60 * 1000;
    }

    if (interview.status === InterviewStatus.PAUSED) {
      return ageMs > env.INTERVIEW_PAUSED_TIMEOUT_HOURS * 60 * 60 * 1000;
    }

    return false;
  }

  /**
   * Ensure interview exists
   */
  private async ensureInterviewExists(
    id: string
  ): Promise<InterviewSessionDocument> {
    this.ensureValidObjectId(id);

    const interview =
      await this.repository.findById(id);

    if (!interview) {
      throw new ApiError(
        404,
        "Interview session not found.",
        ErrorCode.NOT_FOUND
      );
    }

    // Lazy self-healing: the moment anyone looks at a stale session,
    // it formally moves to EXPIRED rather than staying IN_PROGRESS/
    // PAUSED forever. No background job needed for this to work.
    if (this.isStale(interview)) {
      const expired = await this.repository.expireSession(id);
      return expired ?? interview;
    }

    return interview;
  }

  /**
   * Ensure interview belongs to authenticated user
   */
  private async ensureOwner(
    interview: InterviewSessionDocument,
    userId: string
  ): Promise<void> {
    if (
      interview.userId.toString() !== userId
    ) {
      throw new ApiError(
        403,
        "You are not allowed to access this interview.",
        ErrorCode.FORBIDDEN
      );
    }
  }

  /**
   * Ensure interview is in expected status
   */
  private ensureStatus(
    interview: InterviewSessionDocument,
    allowed: InterviewStatus[]
  ): void {
    if (
      !allowed.includes(interview.status)
    ) {
      throw new ApiError(
        409,
        `Interview is currently ${interview.status}.`,
        ErrorCode.CONFLICT
      );
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                            Create Interview                                */
  /* -------------------------------------------------------------------------- */

  /**
   * Create Interview Session
   */
  public async createSession(
    data: CreateInterviewSessionDto,
    userId: string
  ): Promise<InterviewSessionDocument> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new ApiError(
        400,
        "Invalid user id.",
        ErrorCode.BAD_REQUEST
      );
    }

    /**
     * Prevent multiple active interviews
     */
    const activeInterview =
      await this.repository.findActiveSession(
        userId
      );

    if (activeInterview) {
      throw new ApiError(
        409,
        "Finish the current interview before starting another.",
        ErrorCode.CONFLICT
      );
    }

    return this.repository.create({
      ...data,

      userId: new Types.ObjectId(userId),

      status: InterviewStatus.CREATED,

      duration: 0,

      turnCount: 0,

      maxQuestions:
        data.maxQuestions ?? 10,

      score: 0,

      feedback: "",

      startedAt: undefined,

      completedAt: undefined,

      // DTO omits questionsAsked (server-only field); initialise to 0 here.
      sectionPlan: data.sectionPlan?.map((s) => ({ ...s, questionsAsked: 0 })),
    });
  }

  /* -------------------------------------------------------------------------- */
  /*                           Get Interview By Id                              */
  /* -------------------------------------------------------------------------- */

  /**
   * Get interview by id
   */
  public async getSessionById(
    id: string,
    userId: string
  ): Promise<InterviewSessionDocument> {
    const interview =
      await this.ensureInterviewExists(id);

    await this.ensureOwner(
      interview,
      userId
    );

    return interview;
  }

    /* -------------------------------------------------------------------------- */
  /*                          Get User Interview Sessions                       */
  /* -------------------------------------------------------------------------- */

  /**
   * Get all interview sessions of the authenticated user.
   */
  public async getMySessions(
    userId: string,
    page = 1,
    limit = 10
  ): Promise<InterviewSessionDocument[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new ApiError(
        400,
        "Invalid user id.",
        ErrorCode.BAD_REQUEST
      );
    }

    return this.repository.findByUser(
      userId,
      page,
      limit
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                             Delete Interview                               */
  /* -------------------------------------------------------------------------- */

  /**
   * Delete an interview session owned by the authenticated user.
   */
  public async deleteSession(
    id: string,
    userId: string
  ): Promise<void> {
    const interview = await this.ensureInterviewExists(id);
    await this.ensureOwner(interview, userId);
    await this.repository.delete(id);
  }

  /* -------------------------------------------------------------------------- */
  /*                             Update Interview                               */
  /* -------------------------------------------------------------------------- */

  /**
   * Update interview details.
   *
   * Only editable before interview starts.
   */
  public async updateSession(
    id: string,
    data: UpdateInterviewSessionDto,
    userId: string
  ): Promise<InterviewSessionDocument | null> {
    const interview =
      await this.ensureInterviewExists(id);

    await this.ensureOwner(
      interview,
      userId
    );

    this.ensureStatus(interview, [
      InterviewStatus.CREATED,
    ]);

    return this.repository.update(id, data);
  }

  /* -------------------------------------------------------------------------- */
  /*                              Start Interview                               */
  /* -------------------------------------------------------------------------- */

  /**
   * Start interview session.
   */
  public async startSession(
    id: string,
    userId: string
  ): Promise<InterviewSessionDocument | null> {
    const interview =
      await this.ensureInterviewExists(id);

    await this.ensureOwner(
      interview,
      userId
    );

    this.ensureStatus(interview, [
      InterviewStatus.CREATED,
    ]);

    return this.repository.startInterview(
      id
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                              Pause Interview                               */
  /* -------------------------------------------------------------------------- */

  /**
   * Pause interview session.
   */
  public async pauseSession(
    id: string,
    userId: string
  ): Promise<InterviewSessionDocument | null> {
    const interview =
      await this.ensureInterviewExists(id);

    await this.ensureOwner(
      interview,
      userId
    );

    this.ensureStatus(interview, [
      InterviewStatus.IN_PROGRESS,
    ]);

    return this.repository.pauseInterview(
      id
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                             Resume Interview                               */
  /* -------------------------------------------------------------------------- */

  /**
   * Resume paused interview.
   */
  public async resumeSession(
    id: string,
    userId: string
  ): Promise<InterviewSessionDocument | null> {
    const interview =
      await this.ensureInterviewExists(id);

    await this.ensureOwner(
      interview,
      userId
    );

    this.ensureStatus(interview, [
      InterviewStatus.PAUSED,
    ]);

    return this.repository.resumeInterview(
      id
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                             Cancel Interview                               */
  /* -------------------------------------------------------------------------- */

  /**
   * Cancel interview session.
   */
  public async cancelSession(
    id: string,
    userId: string
  ): Promise<InterviewSessionDocument | null> {
    const interview =
      await this.ensureInterviewExists(id);

    await this.ensureOwner(
      interview,
      userId
    );

    this.ensureStatus(interview, [
      InterviewStatus.CREATED,
      InterviewStatus.IN_PROGRESS,
      InterviewStatus.PAUSED,
    ]);

    return this.repository.cancelInterview(
      id
    );
  }

    /* -------------------------------------------------------------------------- */
  /*                            Complete Interview                              */
  /* -------------------------------------------------------------------------- */

  /**
   * Complete interview session.
   */
  public async completeSession(
    id: string,
    userId: string,
    score: number,
    feedback: string,
    duration: number
  ): Promise<InterviewSessionDocument | null> {
    const interview =
      await this.ensureInterviewExists(id);

    await this.ensureOwner(
      interview,
      userId
    );

    this.ensureStatus(interview, [
      InterviewStatus.IN_PROGRESS,
      InterviewStatus.PAUSED,
    ]);

    return this.repository.completeInterview(
      id,
      score,
      feedback,
      duration
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                           Interview Progress                               */
  /* -------------------------------------------------------------------------- */

  /**
   * Increment completed interview turn.
   */
  public async incrementTurn(
    id: string,
    userId: string
  ): Promise<InterviewSessionDocument | null> {
    const interview =
      await this.ensureInterviewExists(id);

    await this.ensureOwner(
      interview,
      userId
    );

    this.ensureStatus(interview, [
      InterviewStatus.IN_PROGRESS,
    ]);

    if (
      interview.turnCount >=
      interview.maxQuestions
    ) {
      throw new ApiError(
        409,
        "Maximum interview turns reached.",
        ErrorCode.CONFLICT
      );
    }

    return this.repository.incrementTurn(id);
  }

  /**
   * Reset interview progress.
   *
   * Useful when restarting an interview.
   */
  public async resetProgress(
    id: string,
    userId: string
  ): Promise<InterviewSessionDocument | null> {
    const interview =
      await this.ensureInterviewExists(id);

    await this.ensureOwner(
      interview,
      userId
    );

    this.ensureStatus(interview, [
      InterviewStatus.CREATED,
      InterviewStatus.CANCELLED,
      InterviewStatus.COMPLETED,
      InterviewStatus.EXPIRED,
    ]);

    return this.repository.resetProgress(id);
  }

  /* -------------------------------------------------------------------------- */
  /*                               Dashboard                                    */
  /* -------------------------------------------------------------------------- */

  /**
   * Get recent interviews.
   */
  public async getRecentInterviews(
    userId: string,
    limit = 5
  ): Promise<InterviewSessionDocument[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new ApiError(
        400,
        "Invalid user id.",
        ErrorCode.BAD_REQUEST
      );
    }

    return this.repository.getRecentInterviews(
      userId,
      limit
    );
  }

  /**
   * Get interview statistics.
   */
  public async getStatistics(
    userId: string
  ) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new ApiError(
        400,
        "Invalid user id.",
        ErrorCode.BAD_REQUEST
      );
    }

    return this.repository.getStatistics(
      userId
    );
  }

  /**
   * Get historical score progression trends.
   */
  public async getScoreTrends(
    userId: string,
    limit = 20
  ) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new ApiError(
        400,
        "Invalid user id.",
        ErrorCode.BAD_REQUEST
      );
    }

    return this.repository.getScoreTrends(userId, limit);
  }
}