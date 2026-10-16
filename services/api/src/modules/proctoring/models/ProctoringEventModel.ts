import { Schema, model } from "mongoose";

import {
  ProctoringEventDocument,
  ProctoringEventStatus,
  ProctoringFlagType,
  ProctoringSeverity,
} from "../types/proctoring.types";

const ProctoringEventSchema = new Schema<ProctoringEventDocument>(
  {
    proctoringSessionId: {
      type: Schema.Types.ObjectId,
      ref: "ProctoringSession",
      required: true,
      index: true,
    },

    candidateId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: Object.values(ProctoringFlagType),
      required: true,
    },

    severity: {
      type: String,
      enum: Object.values(ProctoringSeverity),
      required: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5,
    },

    status: {
      type: String,
      enum: Object.values(ProctoringEventStatus),
      default: ProctoringEventStatus.DETECTED,
      required: true,
    },

    /** Base64 data URL - see the doc comment on the type definition. */
    cameraFrame: {
      type: String,
    },

    durationMs: {
      type: Number,
      min: 0,
    },

    metadata: {
      type: Schema.Types.Mixed,
    },

    occurredAt: {
      type: Date,
      required: true,
      default: () => new Date(),
    },

    /**
     * Auto-expiry date for MongoDB TTL indexing (30 days from occurrence).
     */
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "proctoring_events",
  }
);

/* -------------------------------------------------------------------------- */
/*                                    Indexes                                  */
/* -------------------------------------------------------------------------- */

/**
 * Auto-delete proctoring event documents when expiresAt is reached.
 */
ProctoringEventSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

/**
 * Timeline for a single proctoring session.
 */
ProctoringEventSchema.index({
  proctoringSessionId: 1,
  occurredAt: -1,
});

/**
 * Severity triage across a session.
 */
ProctoringEventSchema.index({
  proctoringSessionId: 1,
  severity: 1,
});

/**
 * Recruiter review queue: unreviewed events across a session.
 */
ProctoringEventSchema.index({
  proctoringSessionId: 1,
  status: 1,
});

export const ProctoringEventModel = model<ProctoringEventDocument>(
  "ProctoringEvent",
  ProctoringEventSchema
);
