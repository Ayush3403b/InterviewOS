import { Response } from "express";

import { BaseController } from "../../../shared/http/BaseController";

import { AuthenticatedRequest } from "../../../shared/security/AuthenticatedRequest";

import { ApiError } from "../../../shared/errors/ApiError";
import { ErrorCode } from "../../../shared/errors/ErrorCode";

import InterviewSessionService from "../services/InterviewSessionService";

import { InterviewSessionResponse } from "../responses/InterviewSessionResponse";

import { CreateInterviewSessionDto } from "../dtos/CreateInterviewSessionDto";
import { UpdateInterviewSessionDto } from "../dtos/UpdateInterviewSessionDto";

export default class InterviewSessionController extends BaseController {
  constructor(
    private readonly interviewSessionService: InterviewSessionService
  ) {
    super();
  }

  /**
   * Returns authenticated user id.
   */
  private getAuthenticatedUserId(
    req: AuthenticatedRequest
  ): string {
    const userId = req.user?.sub;

    if (!userId) {
      throw new ApiError(
        401,
        "Authentication required",
        ErrorCode.UNAUTHORIZED
      );
    }

    return userId;
  }

  /* -------------------------------------------------------------------------- */
  /*                           Create Interview                                 */
  /* -------------------------------------------------------------------------- */

  public createSession = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const userId =
      this.getAuthenticatedUserId(req);

    const interview =
      await this.interviewSessionService.createSession(
        req.body as CreateInterviewSessionDto,
        userId
      );

    this.created(
      res,
      "Interview session created successfully.",
      InterviewSessionResponse.toResponse(
        interview
      )
    );

    return;
  };

  /* -------------------------------------------------------------------------- */
  /*                           Get Interview                                    */
  /* -------------------------------------------------------------------------- */

  public getSessionById = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const userId =
      this.getAuthenticatedUserId(req);

    const interview =
      await this.interviewSessionService.getSessionById(
        id,
        userId
      );

    this.ok(
      res,
      "Interview fetched successfully.",
      InterviewSessionResponse.toResponse(
        interview
      )
    );

    return;
  };

  /* -------------------------------------------------------------------------- */
  /*                         Get My Interviews                                  */
  /* -------------------------------------------------------------------------- */

  public getMySessions = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const userId =
      this.getAuthenticatedUserId(req);

    const page =
      Number(req.query.page) || 1;

    const limit =
      Number(req.query.limit) || 10;

    const interviews =
      await this.interviewSessionService.getMySessions(
        userId,
        page,
        limit
      );

    this.ok(
      res,
      "Interview sessions fetched successfully.",
      InterviewSessionResponse.toSummaryList(
        interviews
      )
    );

    return;
  };

  /* -------------------------------------------------------------------------- */
  /*                         Update Interview                                   */
  /* -------------------------------------------------------------------------- */

  public updateSession = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const userId =
      this.getAuthenticatedUserId(req);

    const interview =
      await this.interviewSessionService.updateSession(
        id,
        req.body as UpdateInterviewSessionDto,
        userId
      );

    if (!interview) {
      throw new ApiError(
        404,
        "Interview session not found.",
        ErrorCode.NOT_FOUND
      );
    }

    this.ok(
      res,
      "Interview updated successfully.",
      InterviewSessionResponse.toResponse(
        interview
      )
    );

    return;
  };

  /* -------------------------------------------------------------------------- */
  /*                         Delete Interview                                   */
  /* -------------------------------------------------------------------------- */

  public deleteSession = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const userId =
      this.getAuthenticatedUserId(req);

    await this.interviewSessionService.deleteSession(
      id,
      userId
    );

    this.ok(
      res,
      "Interview session deleted successfully.",
      { id }
    );

    return;
  };

    /* -------------------------------------------------------------------------- */
  /*                           Start Interview                                  */
  /* -------------------------------------------------------------------------- */

  public startSession = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const userId =
      this.getAuthenticatedUserId(req);

    const interview =
      await this.interviewSessionService.startSession(
        id,
        userId
      );

    if (!interview) {
      throw new ApiError(
        404,
        "Interview session not found.",
        ErrorCode.NOT_FOUND
      );
    }

    this.ok(
      res,
      "Interview started successfully.",
      InterviewSessionResponse.toResponse(
        interview
      )
    );

    return;
  };

  /* -------------------------------------------------------------------------- */
  /*                           Pause Interview                                  */
  /* -------------------------------------------------------------------------- */

  public pauseSession = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const userId =
      this.getAuthenticatedUserId(req);

    const interview =
      await this.interviewSessionService.pauseSession(
        id,
        userId
      );

    if (!interview) {
      throw new ApiError(
        404,
        "Interview session not found.",
        ErrorCode.NOT_FOUND
      );
    }

    this.ok(
      res,
      "Interview paused successfully.",
      InterviewSessionResponse.toResponse(
        interview
      )
    );

    return;
  };

  /* -------------------------------------------------------------------------- */
  /*                           Resume Interview                                 */
  /* -------------------------------------------------------------------------- */

  public resumeSession = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const userId =
      this.getAuthenticatedUserId(req);

    const interview =
      await this.interviewSessionService.resumeSession(
        id,
        userId
      );

    if (!interview) {
      throw new ApiError(
        404,
        "Interview session not found.",
        ErrorCode.NOT_FOUND
      );
    }

    this.ok(
      res,
      "Interview resumed successfully.",
      InterviewSessionResponse.toResponse(
        interview
      )
    );

    return;
  };

  /* -------------------------------------------------------------------------- */
  /*                           Cancel Interview                                 */
  /* -------------------------------------------------------------------------- */

  public cancelSession = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const userId =
      this.getAuthenticatedUserId(req);

    const interview =
      await this.interviewSessionService.cancelSession(
        id,
        userId
      );

    if (!interview) {
      throw new ApiError(
        404,
        "Interview session not found.",
        ErrorCode.NOT_FOUND
      );
    }

    this.ok(
      res,
      "Interview cancelled successfully.",
      InterviewSessionResponse.toResponse(
        interview
      )
    );

    return;
  };

  /* -------------------------------------------------------------------------- */
  /*                          Complete Interview                                */
  /* -------------------------------------------------------------------------- */

  public completeSession = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const userId =
      this.getAuthenticatedUserId(req);

    const {
      score,
      feedback,
      duration,
    } = req.body;

    const interview =
      await this.interviewSessionService.completeSession(
        id,
        userId,
        score,
        feedback,
        duration
      );

    if (!interview) {
      throw new ApiError(
        404,
        "Interview session not found.",
        ErrorCode.NOT_FOUND
      );
    }

    this.ok(
      res,
      "Interview completed successfully.",
      InterviewSessionResponse.toResponse(
        interview
      )
    );

    return;
  };

  /* -------------------------------------------------------------------------- */
  /*                           Recent Interviews                                */
  /* -------------------------------------------------------------------------- */

  public getRecentInterviews = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const userId =
      this.getAuthenticatedUserId(req);

    const limit =
      Number(req.query.limit) || 5;

    const interviews =
      await this.interviewSessionService.getRecentInterviews(
        userId,
        limit
      );

    this.ok(
      res,
      "Recent interviews fetched successfully.",
      InterviewSessionResponse.toSummaryList(
        interviews
      )
    );

    return;
  };

  /* -------------------------------------------------------------------------- */
  /*                           Interview Statistics                             */
  /* -------------------------------------------------------------------------- */

  public getStatistics = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const userId =
      this.getAuthenticatedUserId(req);

    const statistics =
      await this.interviewSessionService.getStatistics(
        userId
      );

    this.ok(
      res,
      "Interview statistics fetched successfully.",
      InterviewSessionResponse.toStatistics(
        statistics
      )
    );

    return;
  };

  /* -------------------------------------------------------------------------- */
  /*                           Score Progression Trends                         */
  /* -------------------------------------------------------------------------- */

  public getScoreTrends = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const userId = this.getAuthenticatedUserId(req);
    const limit = Number(req.query.limit) || 20;

    const trends = await this.interviewSessionService.getScoreTrends(
      userId,
      limit
    );

    this.ok(res, "Score trends fetched successfully.", trends);
    return;
  };
}