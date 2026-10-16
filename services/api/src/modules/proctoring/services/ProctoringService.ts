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
  ProctoredSubjectType,
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

/** What a subject's owning module reports back about it. */
export interface ProctoredSubjectInfo {
  candidateId: string;
  organizationId?: string;
}

/**
 * One lookup per subject type, wired in the container. This is the
 * only place proctoring learns anything about interviews or MCQ
 * attempts - returning null means "no such subject" (404).
 */
export type ProctoredSubjectResolvers = Record<
  ProctoredSubjectType,
  (subjectId: string) => Promise<ProctoredSubjectInfo | null>
>;

export default class ProctoringService extends BaseService<ProctoringSessionRepository> {
  constructor(
    repository: ProctoringSessionRepository,
    private readonly eventRepository: ProctoringEventRepository,
    private readonly agent: IProctoringAgent,
    private readonly subjectResolvers: ProctoredSubjectResolvers
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

  /** candidateId may or may not be populated, depending on the query. */
  private candidateIdOf(session: ProctoringSessionDocument): string {
    const rawCandidate = session.candidateId as unknown;

    return rawCandidate &&
      typeof rawCandidate === "object" &&
      "_id" in (rawCandidate as Record<string, unknown>)
      ? String((rawCandidate as { _id: unknown })._id)
      : String(rawCandidate);
  }

  private ensureAccess(
    session: ProctoringSessionDocument,
    requesterId: string,
    requesterRole?: UserRole
  ): void {
    const isOwner = this.candidateIdOf(session) === requesterId;
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

  /**
   * Asks the subject's owning module who the candidate is, and refuses
   * anyone else - without this, anyone who learned another candidate's
   * interview/attempt id could open (or feed signals into) their
   * proctoring session.
   */
  private async resolveOwnedSubject(
    subjectType: ProctoredSubjectType,
    subjectId: string,
    candidateId: string
  ): Promise<ProctoredSubjectInfo> {
    const resolve = this.subjectResolvers[subjectType];

    if (!resolve) {
      throw new ApiError(400, "Invalid subject type.", ErrorCode.BAD_REQUEST);
    }

    const subject = await resolve(subjectId);

    if (!subject) {
      throw new ApiError(
        404,
        "Nothing to proctor was found for this id.",
        ErrorCode.NOT_FOUND
      );
    }

    if (subject.candidateId !== candidateId) {
      throw new ApiError(
        403,
        "You can only be proctored for your own session.",
        ErrorCode.FORBIDDEN
      );
    }

    return subject;
  }

  /* -------------------------------------------------------------------------- */
  /*                              Session Lifecycle                             */
  /* -------------------------------------------------------------------------- */

  /**
   * Start (or resume) continuous tracking for a subject. Idempotent -
   * calling this again for the same subject returns the existing
   * session instead of erroring, so a flaky client reconnecting
   * mid-session just keeps working.
   *
   * The owning module confirms the caller is the subject's candidate
   * before a session is created. After that the stored candidateId is
   * the check, so continuous signals don't cost an extra lookup.
   */
  public async startSession(
    subjectType: ProctoredSubjectType,
    subjectId: string,
    candidateId: string,
    consentGiven?: boolean,
    consentVersion?: string,
    referenceFrame?: string
  ): Promise<ProctoringSessionDocument> {
    this.ensureValidObjectId(subjectId, "subject id");
    this.ensureValidObjectId(candidateId, "candidate id");

    const existing = await this.repository.findBySubject(subjectId);

    if (existing) {
      if (
        existing.subjectType !== subjectType ||
        this.candidateIdOf(existing) !== candidateId
      ) {
        throw new ApiError(
          403,
          "You can only be proctored for your own session.",
          ErrorCode.FORBIDDEN
        );
      }

      if (referenceFrame && !existing.referenceFrame) {
        await this.repository.setReferenceFrameIfMissing(
          existing._id,
          referenceFrame
        );
        existing.referenceFrame = referenceFrame;
      }

      return existing;
    }

    const subject = await this.resolveOwnedSubject(
      subjectType,
      subjectId,
      candidateId
    );

    const created = await this.repository.createForSubject({
      subjectType,
      subjectId: new Types.ObjectId(subjectId),
      candidateId: new Types.ObjectId(candidateId),
      organizationId:
        subject.organizationId && Types.ObjectId.isValid(subject.organizationId)
          ? new Types.ObjectId(subject.organizationId)
          : undefined,
      agentProvider: this.agent.provider,
      consentGivenAt: consentGiven ? new Date() : undefined,
      consentVersion: consentVersion ?? "1.0",
      referenceFrame,
    });

    if (!created) {
      throw new ApiError(
        500,
        "Could not start the proctoring session.",
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }

    // Lost a creation race to a different candidate's request - same
    // ownership rule as the `existing` branch above.
    if (this.candidateIdOf(created) !== candidateId) {
      throw new ApiError(
        403,
        "You can only be proctored for your own session.",
        ErrorCode.FORBIDDEN
      );
    }

    return created;
  }

  /**
   * Analyze one continuous-tracking signal (sent every few seconds
   * from the client) and persist the outcome.
   *
   * This is deliberately agent-agnostic: whatever IProctoringAgent
   * is wired up in the container decides what counts as a violation.
   */
  public async recordSignal(
    subjectType: ProctoredSubjectType,
    subjectId: string,
    candidateId: string,
    signal: Omit<
      ProctoringSignalInput,
      "subjectId" | "subjectType" | "candidateId" | "timestamp"
    >
  ): Promise<RecordSignalResult> {
    const session = await this.startSession(
      subjectType,
      subjectId,
      candidateId
    );

    if (
      session.status === ProctoringSessionStatus.COMPLETED ||
      session.status === ProctoringSessionStatus.TERMINATED
    ) {
      // Late/stray signal after the session ended - ignore quietly
      // rather than erroring the client out mid-stream.
      return { session, flags: [] };
    }

    const analysis = await this.agent.analyze({
      ...signal,
      subjectType,
      subjectId,
      candidateId,
      timestamp: new Date(),
    });

    if (analysis.flags.length) {
      await this.eventRepository.recordMany(
        session._id,
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
    subjectId: string,
    requesterId: string,
    requesterRole?: UserRole
  ): Promise<ProctoringSessionDocument | null> {
    const session = await this.getSession(
      subjectId,
      requesterId,
      requesterRole
    );

    return this.repository.markCompleted(session._id);
  }

  /**
   * Server-side counterpart to completeSession, for the module that
   * owns the subject to call once it ends (interview finished, MCQ
   * attempt submitted) - the caller has already checked ownership.
   * A subject that was never proctored is a no-op, not an error.
   */
  public async completeSessionForSubject(
    subjectId: string
  ): Promise<ProctoringSessionDocument | null> {
    const session = await this.repository.findBySubject(subjectId);

    return session ? this.repository.markCompleted(session._id) : null;
  }

  public async terminateSession(
    subjectId: string,
    requesterId: string,
    requesterRole?: UserRole
  ): Promise<ProctoringSessionDocument | null> {
    const session = await this.getSession(
      subjectId,
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
    subjectId: string,
    requesterId: string,
    requesterRole?: UserRole
  ): Promise<ProctoringSessionDocument> {
    this.ensureValidObjectId(subjectId, "subject id");

    const session = await this.repository.findBySubject(subjectId);

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

  /**
   * Summary lookup for other modules (e.g. MCQ results listing a risk
   * level per attempt) - no access check, callers have done their own.
   */
  public async findSessionsForSubjects(subjectIds: string[]) {
    return this.repository.findBySubjects(subjectIds);
  }

  public async getEvents(
    subjectId: string,
    requesterId: string,
    requesterRole: UserRole | undefined,
    page = 1,
    limit = 50
  ) {
    const session = await this.getSession(
      subjectId,
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
    subjectId: string,
    requesterId: string,
    requesterRole?: UserRole
  ) {
    const session = await this.getSession(
      subjectId,
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
    subjectId: string,
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
    // belongs to, and implicitly 404s on a bad subjectId.
    const session = await this.getSession(
      subjectId,
      requesterId,
      requesterRole
    );

    const updated = await this.eventRepository.updateStatusInSession(
      eventId,
      session._id,
      status
    );

    if (!updated) {
      throw new ApiError(404, "Proctoring event not found.", ErrorCode.NOT_FOUND);
    }

    return updated;
  }

  /**
   * The end-of-session proctoring report: risk score + level
   * (recomputed fresh from the full event history, not the session's
   * live incremental field - see RiskEngine's doc comment on why),
   * violation count, severity breakdown, the full evidence timeline,
   * a deterministic summary, and a recommendation.
   */
  public async getReport(
    subjectId: string,
    requesterId: string,
    requesterRole?: UserRole
  ) {
    const session = await this.getSession(
      subjectId,
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
