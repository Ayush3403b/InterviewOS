import { Types } from "mongoose";

import { BaseRepository } from "../../../database/BaseRepository";

import { ProctoringEventModel } from "../models/ProctoringEventModel";

import { ProctoringFlag } from "../../../agents/proctoring/IProctoringAgent";

import { ProctoringEventDocument, ProctoringEventStatus } from "../types/proctoring.types";

/** Hard ceiling on a single timeline fetch - a session running for
 *  hours at a 3s tick could otherwise generate thousands of rows. */
const MAX_TIMELINE_EVENTS = 2000;

export class ProctoringEventRepository extends BaseRepository<ProctoringEventDocument> {
  constructor() {
    super(ProctoringEventModel);
  }

  async recordMany(
    proctoringSessionId: Types.ObjectId,
    candidateId: Types.ObjectId,
    flags: ProctoringFlag[]
  ) {
    if (!flags.length) {
      return [];
    }

    return this.model.insertMany(
      flags.map((flag) => ({
        proctoringSessionId,
        candidateId,
        type: flag.type,
        severity: flag.severity,
        message: flag.message,
        confidence: flag.confidence,
        status: ProctoringEventStatus.DETECTED,
        cameraFrame: flag.cameraFrame,
        durationMs: flag.durationMs,
        metadata: flag.metadata,
        occurredAt: new Date(),
      }))
    );
  }

  async findBySession(
    proctoringSessionId: string | Types.ObjectId,
    page = 1,
    limit = 50
  ) {
    const skip = (page - 1) * limit;

    return this.model
      .find({ proctoringSessionId })
      .sort({ occurredAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  /**
   * The full chronological (oldest-first) event history for a
   * session's evidence timeline, rather than the paginated,
   * newest-first list `findBySession` returns for a live activity
   * feed. Capped at `MAX_TIMELINE_EVENTS` - see the constant's doc.
   */
  async findAllForTimeline(proctoringSessionId: string | Types.ObjectId) {
    return this.model
      .find({ proctoringSessionId })
      .sort({ occurredAt: 1 })
      .limit(MAX_TIMELINE_EVENTS);
  }

  async countBySeverity(
    proctoringSessionId: string | Types.ObjectId
  ) {
    return this.model.aggregate([
      {
        $match: {
          proctoringSessionId: new Types.ObjectId(
            proctoringSessionId as string
          ),
        },
      },
      {
        $group: {
          _id: "$severity",
          count: { $sum: 1 },
        },
      },
    ]);
  }

  /**
   * Recruiter review workflow: mark one event acknowledged/dismissed.
   * Scoped to the session so an event id from a different session
   * can't be reviewed through this one's URL.
   */
  async updateStatusInSession(
    eventId: string | Types.ObjectId,
    proctoringSessionId: string | Types.ObjectId,
    status: ProctoringEventStatus
  ) {
    return this.model.findOneAndUpdate(
      { _id: eventId, proctoringSessionId },
      { status },
      { new: true }
    );
  }
}
