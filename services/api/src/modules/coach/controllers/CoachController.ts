import { Response } from "express";

import { BaseController } from "../../../shared/http/BaseController";
import { AuthenticatedRequest } from "../../../shared/security/AuthenticatedRequest";
import { ApiError } from "../../../shared/errors/ApiError";
import { ErrorCode } from "../../../shared/errors/ErrorCode";

import CoachService from "../services/CoachService";
import { toCoachingPlanResponse } from "../dtos/CoachResponse";

export default class CoachController extends BaseController {
  constructor(private readonly coachService: CoachService) {
    super();
  }

  private getUserId(req: AuthenticatedRequest): string {
    const userId = req.user?.sub;

    if (!userId) {
      throw new ApiError(401, "Authentication required", ErrorCode.UNAUTHORIZED);
    }

    return userId;
  }

  public generate = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const userId = this.getUserId(req);
    const sessionId = Array.isArray(req.params.sessionId)
      ? req.params.sessionId[0]
      : req.params.sessionId;

    const plan = await this.coachService.generateForInterview(sessionId, userId);

    this.ok(res, "Coaching plan ready.", toCoachingPlanResponse(plan));
  };

  public getForSession = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const userId = this.getUserId(req);
    const sessionId = Array.isArray(req.params.sessionId)
      ? req.params.sessionId[0]
      : req.params.sessionId;

    const plan = await this.coachService.getForInterview(sessionId, userId);

    this.ok(
      res,
      "Coaching plan resolved.",
      plan ? toCoachingPlanResponse(plan) : null
    );
  };
}
