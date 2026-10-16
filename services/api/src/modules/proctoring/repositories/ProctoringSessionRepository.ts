import { Types } from "mongoose";

import { BaseRepository } from "../../../database/BaseRepository";

import { ProctoringSessionModel } from "../models/ProctoringSessionModel";

import {
  ProctoringFlag,
} from "../../../agents/proctoring/IProctoringAgent";

import { computeRiskDelta, RISK_SCORE_MAX } from "../services/RiskEngine";

import {
  ProctoringSessionDocument,
  ProctoringSessionStatus,
} from "../types/proctoring.types";

export class ProctoringSessionRepository extends BaseRepository<ProctoringSessionDocument> {
  constructor() {
    super(ProctoringSessionModel);
  }

  /* -------------------------------------------------------------------------- */
  /*                                   Queries                                   */
  /* -------------------------------------------------------------------------- */

  async findByInterviewSession(
    interviewSessionId: string | Types.ObjectId
  ) {
    return this.model
      .findOne({ interviewSessionId })
      .populate("candidateId", "firstName lastName email avatar");
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

  async getOrCreate(data: {
    interviewSessionId: Types.ObjectId;
    candidateId: Types.ObjectId;
    organizationId?: Types.ObjectId;
    agentProvider: string;
    consentGivenAt?: Date;
    consentVersion?: string;
    referenceFrame?: string;
  }) {
    const existing = await this.findByInterviewSession(
      data.interviewSessionId
    );

    if (existing) {
      if (data.referenceFrame && !existing.referenceFrame) {
        existing.referenceFrame = data.referenceFrame;
        await existing.save();
      }
      return existing;
    }

    return this.model.create({
      interviewSessionId: data.interviewSessionId,
      candidateId: data.candidateId,
      organizationId: data.organizationId,
      agentProvider: data.agentProvider,
      consentGivenAt: data.consentGivenAt,
      consentVersion: data.consentVersion,
      referenceFrame: data.referenceFrame,
      status: ProctoringSessionStatus.ACTIVE,
      trustScore: 100,
      riskScore: 0,
      totalSignals: 0,
      violationCounts: {},
      startedAt: new Date(),
    });
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
