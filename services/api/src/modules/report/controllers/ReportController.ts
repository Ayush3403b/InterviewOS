import { Response } from "express";

import { BaseController } from "../../../shared/http/BaseController";
import { AuthenticatedRequest } from "../../../shared/security/AuthenticatedRequest";
import { ApiError } from "../../../shared/errors/ApiError";
import { ErrorCode } from "../../../shared/errors/ErrorCode";

import ReportService from "../services/ReportService";
import { toReportResponse } from "../dtos/ReportResponse";

export default class ReportController extends BaseController {
  constructor(private readonly reportService: ReportService) {
    super();
  }

  private getUserId(req: AuthenticatedRequest): string {
    const userId = req.user?.sub;

    if (!userId) {
      throw new ApiError(401, "Authentication required", ErrorCode.UNAUTHORIZED);
    }

    return userId;
  }

  private getSessionId(req: AuthenticatedRequest): string {
    return Array.isArray(req.params.sessionId)
      ? req.params.sessionId[0]
      : req.params.sessionId;
  }

  public generate = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const userId = this.getUserId(req);
    const sessionId = this.getSessionId(req);

    const report = await this.reportService.generateForInterview(
      sessionId,
      userId
    );

    this.ok(res, "Report ready.", toReportResponse(report));
  };

  public getForSession = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const userId = this.getUserId(req);
    const sessionId = this.getSessionId(req);

    const report = await this.reportService.getForInterview(sessionId, userId);

    this.ok(
      res,
      "Report resolved.",
      report ? toReportResponse(report) : null
    );
  };

  public downloadPdf = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const userId = this.getUserId(req);
    const sessionId = this.getSessionId(req);

    const pdfBuffer = await this.reportService.getPdf(sessionId, userId);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="interview-report-${sessionId}.pdf"`
    );
    res.send(pdfBuffer);
  };

  public createShareLink = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const userId = this.getUserId(req);
    const sessionId = this.getSessionId(req);
    const expiresInDays = req.body?.expiresInDays ? Number(req.body.expiresInDays) : 30;

    const result = await this.reportService.createShareLink(
      sessionId,
      userId,
      expiresInDays
    );

    this.ok(res, "Public share link generated.", result);
  };

  public revokeShareLink = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const userId = this.getUserId(req);
    const sessionId = this.getSessionId(req);

    await this.reportService.revokeShareLink(sessionId, userId);

    this.ok(res, "Public share link revoked.");
  };

  public getByShareToken = async (
    req: any,
    res: Response
  ): Promise<void> => {
    const shareToken = Array.isArray(req.params.shareToken)
      ? req.params.shareToken[0]
      : req.params.shareToken;

    const report = await this.reportService.getByShareToken(shareToken);

    this.ok(res, "Shared report resolved.", toReportResponse(report));
  };
}
