import { Response } from "express";

import { BaseController } from "../../../shared/http/BaseController";
import { AuthenticatedRequest } from "../../../shared/security/AuthenticatedRequest";
import { ApiError } from "../../../shared/errors/ApiError";
import { ErrorCode } from "../../../shared/errors/ErrorCode";

import McqAttemptService from "../services/McqAttemptService";

import { McqTestResponse } from "../responses/McqTestResponse";

import { parseBody } from "../validations/parseBody";
import { SaveAnswerBody, SubmitAttemptBody } from "../validations/McqTest.validation";

/** Candidates taking tests - any signed-in user with an access code. */
export default class McqAttemptController extends BaseController {
  constructor(private readonly mcqAttemptService: McqAttemptService) {
    super();
  }

  private getAuthenticatedUserId(req: AuthenticatedRequest): string {
    const userId = req.user?.sub;

    if (!userId) {
      throw new ApiError(401, "Authentication required", ErrorCode.UNAUTHORIZED);
    }

    return userId;
  }

  private param(req: AuthenticatedRequest, name: string): string {
    const value = req.params[name];
    return Array.isArray(value) ? value[0] : value;
  }

  public previewByCode = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { test, myAttempt } = await this.mcqAttemptService.previewByCode(
      this.param(req, "code"),
      this.getAuthenticatedUserId(req)
    );

    this.ok(res, "Test found.", McqTestResponse.toTestPreview(test, myAttempt));
  };

  public startAttempt = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const attempt = await this.mcqAttemptService.startAttempt(
      this.param(req, "code"),
      this.getAuthenticatedUserId(req)
    );

    this.ok(res, "Attempt ready.", McqTestResponse.toCandidateAttempt(attempt));
  };

  public listMyAttempts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const attempts = await this.mcqAttemptService.listMyAttempts(
      this.getAuthenticatedUserId(req)
    );

    this.ok(
      res,
      "Attempts fetched.",
      attempts.map((attempt) => McqTestResponse.toMyAttemptSummary(attempt))
    );
  };

  public getMyAttempt = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const attempt = await this.mcqAttemptService.getMyAttempt(
      this.param(req, "attemptId"),
      this.getAuthenticatedUserId(req)
    );

    this.ok(res, "Attempt fetched.", McqTestResponse.toCandidateAttempt(attempt));
  };

  public saveAnswer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { questionId, selectedOptionIndex } = parseBody(SaveAnswerBody, req.body);

    await this.mcqAttemptService.saveAnswer(
      this.param(req, "attemptId"),
      this.getAuthenticatedUserId(req),
      questionId,
      selectedOptionIndex
    );

    this.ok(res, "Answer saved.", { questionId, selectedOptionIndex });
  };

  public submitAttempt = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { reason } = parseBody(SubmitAttemptBody, req.body);

    const attempt = await this.mcqAttemptService.submitAttempt(
      this.param(req, "attemptId"),
      this.getAuthenticatedUserId(req),
      reason
    );

    this.ok(res, "Attempt submitted.", McqTestResponse.toCandidateAttempt(attempt));
  };
}
