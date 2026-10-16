import { Response } from "express";

import { BaseController } from "../../../shared/http/BaseController";

import { AuthenticatedRequest } from "../../../shared/security/AuthenticatedRequest";

import { ApiError } from "../../../shared/errors/ApiError";
import { ErrorCode } from "../../../shared/errors/ErrorCode";

import ProctoringService from "../services/ProctoringService";
import AuditLogService from "../../audit-log/services/AuditLogService";
import { AuditAction } from "../../audit-log/types/audit-log.types";

import { ProctoringResponse } from "../responses/ProctoringResponse";

import { StartProctoringSessionDto } from "../dtos/StartProctoringSessionDto";
import { RecordSignalDto } from "../dtos/RecordSignalDto";
import { UpdateEventStatusDto } from "../dtos/UpdateEventStatusDto";

export default class ProctoringController extends BaseController {
  constructor(
    private readonly proctoringService: ProctoringService,
    private readonly auditLogService: AuditLogService
  ) {
    super();
  }

  private getAuthenticatedUser(req: AuthenticatedRequest) {
    const userId = req.user?.sub;

    if (!userId) {
      throw new ApiError(
        401,
        "Authentication required",
        ErrorCode.UNAUTHORIZED
      );
    }

    return { userId, role: req.user?.role };
  }

  private getInterviewSessionId(req: AuthenticatedRequest): string {
    return Array.isArray(req.params.interviewSessionId)
      ? req.params.interviewSessionId[0]
      : req.params.interviewSessionId;
  }

  /* -------------------------------------------------------------------------- */
  /*                              Start Session                                 */
  /* -------------------------------------------------------------------------- */

  public startSession = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const { userId } = this.getAuthenticatedUser(req);

    const {
      interviewSessionId,
      organizationId,
      consentGiven,
      consentVersion,
      referenceFrame,
    } = req.body as StartProctoringSessionDto;

    const session = await this.proctoringService.startSession(
      interviewSessionId,
      userId,
      organizationId,
      consentGiven,
      consentVersion,
      referenceFrame
    );

    this.created(
      res,
      "Continuous tracking started.",
      ProctoringResponse.toSessionResponse(session)
    );
  };

  /* -------------------------------------------------------------------------- */
  /*                    Signal Ingestion (HTTP fallback path)                   */
  /* -------------------------------------------------------------------------- */

  /**
   * Sockets are the primary transport for continuous signals (see
   * `src/socket/gateway.ts`). This endpoint exists as a fallback for
   * clients/networks where a persistent socket isn't available.
   */
  public recordSignal = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const { userId } = this.getAuthenticatedUser(req);
    const interviewSessionId = this.getInterviewSessionId(req);

    const result = await this.proctoringService.recordSignal(
      interviewSessionId,
      userId,
      req.body as RecordSignalDto
    );

    this.ok(res, "Signal recorded.", {
      session: ProctoringResponse.toSessionResponse(result.session),
      flags: result.flags,
    });
  };

  /* -------------------------------------------------------------------------- */
  /*                                Get Session                                 */
  /* -------------------------------------------------------------------------- */

  public getSession = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const { userId, role } = this.getAuthenticatedUser(req);
    const interviewSessionId = this.getInterviewSessionId(req);

    const session = await this.proctoringService.getSession(
      interviewSessionId,
      userId,
      role
    );

    this.ok(
      res,
      "Proctoring session fetched successfully.",
      ProctoringResponse.toSessionResponse(session)
    );
  };

  /* -------------------------------------------------------------------------- */
  /*                                 Get Events                                 */
  /* -------------------------------------------------------------------------- */

  public getEvents = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const { userId, role } = this.getAuthenticatedUser(req);
    const interviewSessionId = this.getInterviewSessionId(req);

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;

    const events = await this.proctoringService.getEvents(
      interviewSessionId,
      userId,
      role,
      page,
      limit
    );

    this.ok(
      res,
      "Proctoring events fetched successfully.",
      ProctoringResponse.toEventList(events)
    );
  };

  /* -------------------------------------------------------------------------- */
  /*                                 Get Report                                 */
  /* -------------------------------------------------------------------------- */

  public getReport = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const { userId, role } = this.getAuthenticatedUser(req);
    const interviewSessionId = this.getInterviewSessionId(req);

    const report = await this.proctoringService.getReport(
      interviewSessionId,
      userId,
      role
    );

    this.ok(
      res,
      "Proctoring report fetched successfully.",
      ProctoringResponse.toReport(report)
    );
  };

  /* -------------------------------------------------------------------------- */
  /*                              Get Timeline                                  */
  /* -------------------------------------------------------------------------- */

  public getTimeline = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const { userId, role } = this.getAuthenticatedUser(req);
    const interviewSessionId = this.getInterviewSessionId(req);

    const timeline = await this.proctoringService.getTimeline(
      interviewSessionId,
      userId,
      role
    );

    this.ok(
      res,
      "Proctoring timeline fetched successfully.",
      ProctoringResponse.toEventList(timeline)
    );
  };

  /* -------------------------------------------------------------------------- */
  /*                            Update Event Status                             */
  /* -------------------------------------------------------------------------- */

  public updateEventStatus = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const { userId, role } = this.getAuthenticatedUser(req);
    const interviewSessionId = this.getInterviewSessionId(req);

    const eventId = Array.isArray(req.params.eventId)
      ? req.params.eventId[0]
      : req.params.eventId;

    const { status } = req.body as UpdateEventStatusDto;

    const event = await this.proctoringService.updateEventStatus(
      interviewSessionId,
      eventId,
      status,
      userId,
      role
    );

    await this.auditLogService.record({
      action: AuditAction.PROCTORING_EVENT_STATUS_UPDATED,
      actorId: userId,
      targetId: eventId,
      metadata: { interviewSessionId, status },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    this.ok(
      res,
      "Proctoring event updated.",
      ProctoringResponse.toEventResponse(event)
    );
  };

  /* -------------------------------------------------------------------------- */
  /*                              Complete Session                              */
  /* -------------------------------------------------------------------------- */

  public completeSession = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const { userId, role } = this.getAuthenticatedUser(req);
    const interviewSessionId = this.getInterviewSessionId(req);

    const session = await this.proctoringService.completeSession(
      interviewSessionId,
      userId,
      role
    );

    if (!session) {
      throw new ApiError(
        404,
        "Proctoring session not found.",
        ErrorCode.NOT_FOUND
      );
    }

    this.ok(
      res,
      "Continuous tracking stopped.",
      ProctoringResponse.toSessionResponse(session)
    );
  };

  /* -------------------------------------------------------------------------- */
  /*                             Terminate Session                              */
  /* -------------------------------------------------------------------------- */

  public terminateSession = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const { userId, role } = this.getAuthenticatedUser(req);
    const interviewSessionId = this.getInterviewSessionId(req);

    const session = await this.proctoringService.terminateSession(
      interviewSessionId,
      userId,
      role
    );

    if (!session) {
      throw new ApiError(
        404,
        "Proctoring session not found.",
        ErrorCode.NOT_FOUND
      );
    }

    await this.auditLogService.record({
      action: AuditAction.PROCTORING_SESSION_TERMINATED,
      actorId: userId,
      targetId: interviewSessionId,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    this.ok(
      res,
      "Proctoring session terminated.",
      ProctoringResponse.toSessionResponse(session)
    );
  };

  /* -------------------------------------------------------------------------- */
  /*                              Flagged Sessions                              */
  /* -------------------------------------------------------------------------- */

  public getFlaggedSessions = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const rawOrganizationId = Array.isArray(req.query.organizationId)
      ? req.query.organizationId[0]
      : req.query.organizationId;

    const organizationId =
      typeof rawOrganizationId === "string" ? rawOrganizationId : undefined;

    const sessions = await this.proctoringService.getFlaggedSessions(
      organizationId
    );

    this.ok(
      res,
      "Flagged proctoring sessions fetched successfully.",
      sessions.map((session) =>
        ProctoringResponse.toSessionResponse(session)
      )
    );
  };
}
