import { Response } from "express";

import { BaseController } from "../../../shared/http/BaseController";
import { AuthenticatedRequest } from "../../../shared/security/AuthenticatedRequest";

import AiUsageService from "../services/AiUsageService";
import { AiUsageAlertService } from "../services/AiUsageAlertService";

export default class AiUsageController extends BaseController {
  constructor(
    private readonly service: AiUsageService,
    private readonly alertService?: AiUsageAlertService
  ) {
    super();
  }

  public getUsageForSession = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const sessionId = Array.isArray(req.params.sessionId)
      ? req.params.sessionId[0]
      : req.params.sessionId;

    const logs = await this.service.getUsageForSession(sessionId);

    this.ok(res, "AI usage fetched.", logs);
  };

  public getUsageSummary = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const rawInterviewSessionId = Array.isArray(req.query.interviewSessionId)
      ? req.query.interviewSessionId[0]
      : req.query.interviewSessionId;

    const interviewSessionId =
      typeof rawInterviewSessionId === "string" ? rawInterviewSessionId : undefined;

    const summary = await this.service.getUsageSummary({
      interviewSessionId,
    });

    this.ok(res, "AI usage summary fetched.", summary);
  };

  public getBudgetStatus = async (
    _req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    if (!this.alertService) {
      this.ok(res, "Budget alert service not configured.", {
        overallStatus: "NORMAL",
        alerts: [],
      });
      return;
    }

    const report = await this.alertService.getBudgetStatus();
    this.ok(res, "AI budget status fetched successfully.", report);
  };
}
