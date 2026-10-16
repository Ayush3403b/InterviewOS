import { Types } from "mongoose";

import { ApiError } from "../../../shared/errors/ApiError";
import { ErrorCode } from "../../../shared/errors/ErrorCode";
import { BaseService } from "../../../shared/services/BaseService";

import { UserRole } from "../../users/types/user.types";

import { ProctoringSessionRepository } from "../repositories/ProctoringSessionRepository";
import { ProctoringEventRepository } from "../repositories/ProctoringEventRepository";

import {
  IProctoringAgent,
  ProctoringFlag,
  ProctoringSignalInput,
} from "../../../agents/proctoring/IProctoringAgent";

import {
  ProctoringSessionDocument,
  ProctoringSessionStatus,
  ProctoringSeverity,
  ProctoringEventStatus,
} from "../types/proctoring.types";

import {
  computeRiskScore,
  countViolations,
  getRecommendation,
  getRiskLevel,
  weightOf,
} from "./RiskEngine";
import { generateSummary, topOffenses } from "./ReportSummary";

const ELEVATED_ROLES: UserRole[] = [
  UserRole.RECRUITER,
  UserRole.FACULTY,
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
];

/**
 * Trust score floor below which a session gets auto-flagged for
 * recruiter review, even without a single CRITICAL flag.
 */
const AUTO_FLAG_TRUST_THRESHOLD = 60;

export interface RecordSignalResult {
  session: ProctoringSessionDocument;
  flags: ProctoringFlag[];
}

export default class ProctoringService extends BaseService<ProctoringSessionRepository> {
  constructor(
    repository: ProctoringSessionRepository,
    private readonly eventRepository: ProctoringEventRepository,
    private readonly agent: IProctoringAgent
  ) {
    super(repository);
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Helpers                              */
  /* -------------------------------------------------------------------------- */

  private ensureValidObjectId(id: string, label = "resource id"): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(400, `Invalid ${label}.`, ErrorCode.BAD_REQUEST);
    }
  }

  private ensureAccess(
    session: ProctoringSessionDocument,
    requesterId: string,
    requesterRole?: UserRole
  ): void {
    const rawCandidate = session.candidateId as unknown;
    const candidateIdStr =
      rawCandidate &&
      typeof rawCandidate === "object" &&
      "_id" in (rawCandidate as Record<string, unknown>)
        ? String((rawCandidate as { _id: unknown })._id)
        : String(rawCandidate);

    const isOwner = candidateIdStr === requesterId;
    const isElevated = requesterRole
      ? ELEVATED_ROLES.includes(requesterRole)
      : false;

    if (!isOwner && !isElevated) {
      throw new ApiError(
        403,
        "You are not allowed to access this proctoring session.",
        ErrorCode.FORBIDDEN
      );
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                              Session Lifecycle                             */
  /* -------------------------------------------------------------------------- */

  /**
   * Start (or resume) continuous tracking for an interview session.
   * Idempotent - calling this again for the same interview returns
   * the existing session instead of erroring, so a flaky client
   * reconnecting mid-interview just keeps working.
   */
  public async startSession(
    interviewSessionId: string,
    candidateId: string,
    organizationId?: string,
    consentGiven?: boolean,
    consentVersion?: string,
    referenceFrame?: string
  ): Promise<ProctoringSessionDocument> {
    this.ensureValidObjectId(interviewSessionId, "interview session id");
    this.ensureValidObjectId(candidateId, "candidate id");

    return this.repository.getOrCreate({
      interviewSessionId: new Types.ObjectId(interviewSessionId),
      candidateId: new Types.ObjectId(candidateId),
      organizationId:
        organizationId && Types.ObjectId.isValid(organizationId)
          ? new Types.ObjectId(organizationId)
          : undefined,
      agentProvider: this.agent.provider,
      consentGivenAt: consentGiven ? new Date() : undefined,
      consentVersion: consentVersion ?? "1.0",
      referenceFrame,
    });
  }

  /**
   * Analyze one continuous-tracking signal (sent every few seconds
   * from the client) and persist the outcome.
   *
   * This is deliberately agent-agnostic: whatever IProctoringAgent
   * is wired up in the container decides what counts as a violation.
   */
  public async recordSignal(
    interviewSessionId: string,
    candidateId: string,
    signal: Omit<
      ProctoringSignalInput,
      "interviewSessionId" | "candidateId" | "timestamp"
    >
  ): Promise<RecordSignalResult> {
    this.ensureValidObjectId(interviewSessionId, "interview session id");
    this.ensureValidObjectId(candidateId, "candidate id");

    const session = await this.startSession(
      interviewSessionId,
      candidateId
    );

    if (
      session.status === ProctoringSessionStatus.COMPLETED ||
      session.status === ProctoringSessionStatus.TERMINATED
    ) {
      // Late/stray signal after the interview ended - ignore quietly
      // rather than erroring the client out mid-stream.
      return { session, flags: [] };
    }

    const analysis = await this.agent.analyze({
      ...signal,
      interviewSessionId,
      candidateId,
      timestamp: new Date(),
    });

    if (analysis.flags.length) {
      await this.eventRepository.recordMany(
        session._id,
        new Types.ObjectId(interviewSessionId),
        new Types.ObjectId(candidateId),
        analysis.flags
      );
    }

    const hasCriticalFlag = analysis.flags.some(
      (flag) => flag.severity === ProctoringSeverity.CRITICAL
    );

    const projectedTrustScore = Math.max(
      0,
      Math.min(100, session.trustScore + analysis.trustScoreDelta)
    );

    const shouldFlag =
      hasCriticalFlag || projectedTrustScore < AUTO_FLAG_TRUST_THRESHOLD;

    const updated = await this.repository.applySignalResult(
      session._id,
      analysis.flags,
      analysis.trustScoreDelta,
      shouldFlag
    );

    return {
      session: updated ?? session,
      flags: analysis.flags,
    };
  }

  public async completeSession(
    interviewSessionId: string,
    requesterId: string,
    requesterRole?: UserRole
  ): Promise<ProctoringSessionDocument | null> {
    const session = await this.getSession(
      interviewSessionId,
      requesterId,
      requesterRole
    );

    return this.repository.markCompleted(session._id);
  }

  public async terminateSession(
    interviewSessionId: string,
    requesterId: string,
    requesterRole?: UserRole
  ): Promise<ProctoringSessionDocument | null> {
    const session = await this.getSession(
      interviewSessionId,
      requesterId,
      requesterRole
    );

    if (!requesterRole || !ELEVATED_ROLES.includes(requesterRole)) {
      throw new ApiError(
        403,
        "Only recruiters/organization staff can terminate a proctoring session.",
        ErrorCode.FORBIDDEN
      );
    }

    return this.repository.markTerminated(session._id);
  }

  /* -------------------------------------------------------------------------- */
  /*                                   Reads                                    */
  /* -------------------------------------------------------------------------- */

  public async getSession(
    interviewSessionId: string,
    requesterId: string,
    requesterRole?: UserRole
  ): Promise<ProctoringSessionDocument> {
    this.ensureValidObjectId(interviewSessionId, "interview session id");

    const session = await this.repository.findByInterviewSession(
      interviewSessionId
    );

    if (!session) {
      throw new ApiError(
        404,
        "Proctoring session not found.",
        ErrorCode.NOT_FOUND
      );
    }

    this.ensureAccess(session, requesterId, requesterRole);

    return session;
  }

  public async getEvents(
    interviewSessionId: string,
    requesterId: string,
    requesterRole: UserRole | undefined,
    page = 1,
    limit = 50
  ) {
    const session = await this.getSession(
      interviewSessionId,
      requesterId,
      requesterRole
    );

    return this.eventRepository.findBySession(session._id, page, limit);
  }

  /**
   * Full chronological evidence timeline for a session - every event,
   * oldest first, capped at MAX_TIMELINE_EVENTS (see the repository).
   */
  public async getTimeline(
    interviewSessionId: string,
    requesterId: string,
    requesterRole?: UserRole
  ) {
    const session = await this.getSession(
      interviewSessionId,
      requesterId,
      requesterRole
    );

    return this.eventRepository.findAllForTimeline(session._id);
  }

  /**
   * Recruiter review workflow: mark one event acknowledged (stands
   * as-is) or dismissed (false positive / non-issue). Elevated roles
   * only - a candidate can't dismiss their own violations.
   */
  public async updateEventStatus(
    interviewSessionId: string,
    eventId: string,
    status: ProctoringEventStatus,
    requesterId: string,
    requesterRole?: UserRole
  ) {
    this.ensureValidObjectId(eventId, "event id");

    if (!requesterRole || !ELEVATED_ROLES.includes(requesterRole)) {
      throw new ApiError(
        403,
        "Only recruiters/organization staff can review proctoring events.",
        ErrorCode.FORBIDDEN
      );
    }

    // Confirms the requester has access to the *session* the event
    // belongs to, and implicitly 404s on a bad interviewSessionId.
    await this.getSession(interviewSessionId, requesterId, requesterRole);

    const updated = await this.eventRepository.updateStatus(eventId, status);

    if (!updated) {
      throw new ApiError(404, "Proctoring event not found.", ErrorCode.NOT_FOUND);
    }

    return updated;
  }

  /**
   * The end-of-interview proctoring report: risk score + level
   * (recomputed fresh from the full event history, not the session's
   * live incremental field - see RiskEngine's doc comment on why),
   * violation count, severity breakdown, the full evidence timeline,
   * a deterministic summary, and a recommendation.
   */
  public async getReport(
    interviewSessionId: string,
    requesterId: string,
    requesterRole?: UserRole
  ) {
    const session = await this.getSession(
      interviewSessionId,
      requesterId,
      requesterRole
    );

    const [timeline, severityBreakdown] = await Promise.all([
      this.eventRepository.findAllForTimeline(session._id),
      this.eventRepository.countBySeverity(session._id),
    ]);

    const riskScore = computeRiskScore(timeline);
    const riskLevel = getRiskLevel(riskScore);
    const violationCount = countViolations(timeline);
    const violationEvents = timeline.filter((event) => weightOf(event.type) > 0);

    const durationMs = session.endedAt
      ? session.endedAt.getTime() - session.startedAt.getTime()
      : null;

    const summary = generateSummary({
      riskScore,
      riskLevel,
      violationCount,
      totalEvents: timeline.length,
      topOffenses: topOffenses(violationEvents),
      durationMs,
    });

    return {
      session,
      timeline,
      severityBreakdown,
      riskScore,
      riskLevel,
      violationCount,
      summary,
      recommendation: getRecommendation(riskLevel),
    };
  }

  public async getFlaggedSessions(organizationId?: string) {
    return this.repository.findFlagged(organizationId);
  }
}
