import { Response } from "express";

import { BaseController } from "../../../shared/http/BaseController";
import { AuthenticatedRequest } from "../../../shared/security/AuthenticatedRequest";
import { ApiError } from "../../../shared/errors/ApiError";
import { ErrorCode } from "../../../shared/errors/ErrorCode";

import { InterviewOrchestrator } from "../services/InterviewOrchestrator";

export default class OrchestratorController extends BaseController {
  constructor(private readonly orchestrator: InterviewOrchestrator) {
    super();
  }

  private getUserId(req: AuthenticatedRequest): string {
    const userId = req.user?.sub;
    if (!userId) {
      throw new ApiError(401, "Authentication required", ErrorCode.UNAUTHORIZED);
    }
    return userId;
  }

  public getNextQuestion = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const userId = this.getUserId(req);
    const sessionId = Array.isArray(req.params.sessionId)
      ? req.params.sessionId[0]
      : req.params.sessionId;

    const result = await this.orchestrator.getNextQuestion(sessionId, userId);

    this.ok(res, "Next question resolved.", result);
  };

  public submitAnswer = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const userId = this.getUserId(req);
    const turnId = Array.isArray(req.params.turnId)
      ? req.params.turnId[0]
      : req.params.turnId;

    const { answer, timeTaken, sessionId } = req.body as {
      answer: string;
      timeTaken?: number;
      sessionId: string;
    };

    const result = await this.orchestrator.submitAnswer(
      turnId,
      answer,
      timeTaken,
      sessionId,
      userId
    );

    this.ok(res, "Answer submitted.", result);
  };

  public finishInterview = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const userId = this.getUserId(req);
    const sessionId = Array.isArray(req.params.sessionId)
      ? req.params.sessionId[0]
      : req.params.sessionId;

    const { durationSeconds } = req.body as { durationSeconds: number };

    const result = await this.orchestrator.finishInterview(
      sessionId,
      userId,
      durationSeconds
    );

    this.ok(res, "Interview finished and evaluated.", result);
  };
}
