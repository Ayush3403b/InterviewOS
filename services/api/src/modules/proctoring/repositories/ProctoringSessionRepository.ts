import { Types } from "mongoose";

import { BaseRepository } from "../../../database/BaseRepository";

import { ProctoringSessionModel } from "../models/ProctoringSessionModel";

import {
  ProctoringFlag,
} from "../../../agents/proctoring/IProctoringAgent";

import { computeRiskDelta, RISK_SCORE_MAX } from "../services/RiskEngine";

import {
  ProctoredSubjectType,
  ProctoringSessionDocument,
  ProctoringSessionStatus,
} from "../types/proctoring.types";

const DUPLICATE_KEY_ERROR_CODE = 11000;

export class ProctoringSessionRepository extends BaseRepository<ProctoringSessionDocument> {
  constructor() {
    super(ProctoringSessionModel);
  }

  /* -------------------------------------------------------------------------- */
  /*                                   Queries                                   */
  /* -------------------------------------------------------------------------- */

  /**
   * Looks a session up by subjectId alone - ObjectIds don't collide
   * across collections, so the subject type isn't needed to find it.
   */
  async findBySubject(subjectId: string | Types.ObjectId) {
    return this.model
      .findOne({ subjectId })
      .populate("candidateId", "firstName lastName email avatar");
  }

  /** Batch lookup for listings - unpopulated, summary fields only. */
  async findBySubjects(subjectIds: (string | Types.ObjectId)[]) {
    if (!subjectIds.length) {
      return [];
    }

    return this.model
      .find({ subjectId: { $in: subjectIds } })
      .select("subjectType subjectId status trustScore riskScore flaggedAt endedAt");
  }

  async findByOrganization(
    organizationId: string | Types.ObjectId,
    page = 1,
    limit = 20
  ) {
    const skip = (page - 1) * limit;

    return this.model
      .find({ organizationId })
      .populate("candidateId", "firstName lastName email avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  async findFlagged(
    organizationId?: string | Types.ObjectId
  ) {
    return this.model
      .find({
        status: ProctoringSessionStatus.FLAGGED,
        ...(organizationId ? { organizationId } : {}),
      })
      .populate("candidateId", "firstName lastName email avatar")
      .sort({ updatedAt: -1 });
  }

  /* -------------------------------------------------------------------------- */
  /*                                  Mutations                                  */
  /* -------------------------------------------------------------------------- */

  /**
   * Two first-time calls for the same subject (the socket join racing an
   * early one-off signal) can both miss `findBySubject`. The unique
   * subject index rejects the second insert, so that caller just gets
   * the row the first one created.
   */
  async createForSubject(data: {
    subjectType: ProctoredSubjectType;
    subjectId: Types.ObjectId;
    candidateId: Types.ObjectId;
    organizationId?: Types.ObjectId;
    agentProvider: string;
    consentGivenAt?: Date;
    consentVersion?: string;
    referenceFrame?: string;
  }) {
    try {
      await this.model.create({
        ...data,
        status: ProctoringSessionStatus.ACTIVE,
        trustScore: 100,
        riskScore: 0,
        totalSignals: 0,
        violationCounts: {},
        startedAt: new Date(),
      });
    } catch (error) {
      if ((error as { code?: number })?.code !== DUPLICATE_KEY_ERROR_CODE) {
        throw error;
      }
    }

    // Re-read rather than returning the created doc, so callers always
    // get the same populated shape `findBySubject` returns.
    return this.findBySubject(data.subjectId);
  }

  /** Only fills the reference frame in - never replaces one already on file. */
  async setReferenceFrameIfMissing(
    id: string | Types.ObjectId,
    referenceFrame: string
  ) {
    await this.model.updateOne(
      { _id: id, referenceFrame: { $exists: false } },
      { referenceFrame }
    );
  }

  /**
   * Apply the outcome of one analyzed signal: bump the signal count,
   * adjust trust score, increment per-type violation counters, and
   * flip status to FLAGGED if warranted - all atomically.
   */
  async applySignalResult(
    id: string | Types.ObjectId,
    flags: ProctoringFlag[],
    trustScoreDelta: number,
    shouldFlag: boolean
  ) {
    const inc: Record<string, number> = {
      totalSignals: 1,
    };

    for (const flag of flags) {
      inc[`violationCounts.${flag.type}`] =
        (inc[`violationCounts.${flag.type}`] ?? 0) + 1;
    }

    const session = await this.model.findById(id);

    if (!session) {
      return null;
    }

    const nextTrustScore = Math.max(
      0,
      Math.min(100, session.trustScore + trustScoreDelta)
    );

    const nextRiskScore = Math.max(
      0,
      Math.min(RISK_SCORE_MAX, session.riskScore + computeRiskDelta(flags))
    );

    return this.model.findByIdAndUpdate(
      id,
      {
        $inc: inc,
        $set: {
          trustScore: nextTrustScore,
          riskScore: nextRiskScore,
          lastSignalAt: new Date(),
          ...(shouldFlag && session.status === ProctoringSessionStatus.ACTIVE
            ? {
                status: ProctoringSessionStatus.FLAGGED,
                flaggedAt: new Date(),
              }
            : {}),
        },
      },
      { new: true }
    );
  }

  /**
   * Mark a session as ended. A session already FLAGGED keeps that
   * status (a recruiter still needs to review it) - only ACTIVE
   * sessions transition to COMPLETED.
   */
  async markCompleted(id: string | Types.ObjectId) {
    const session = await this.model.findById(id);

    if (!session) {
      return null;
    }

    // Already ended (completed or terminated) - keep the original endedAt.
    if (session.endedAt) {
      return session;
    }

    return this.model.findByIdAndUpdate(
      id,
      {
        endedAt: new Date(),
        ...(session.status === ProctoringSessionStatus.ACTIVE
          ? { status: ProctoringSessionStatus.COMPLETED }
          : {}),
      },
      { new: true }
    );
  }

  async markTerminated(id: string | Types.ObjectId) {
    return this.model.findByIdAndUpdate(
      id,
      {
        status: ProctoringSessionStatus.TERMINATED,
        endedAt: new Date(),
      },
      { new: true }
    );
  }
}
