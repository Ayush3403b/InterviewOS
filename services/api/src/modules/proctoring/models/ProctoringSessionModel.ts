import { Schema, model } from "mongoose";

import {
  ProctoringSessionDocument,
  ProctoringSessionStatus,
} from "../types/proctoring.types";

const ProctoringSessionSchema = new Schema<ProctoringSessionDocument>(
  {
    interviewSessionId: {
      type: Schema.Types.ObjectId,
      ref: "InterviewSession",
      required: true,
      index: true,
      unique: true,
    },

    candidateId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
    },

    status: {
      type: String,
      enum: Object.values(ProctoringSessionStatus),
      default: ProctoringSessionStatus.ACTIVE,
      required: true,
    },

    trustScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },

    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    totalSignals: {
      type: Number,
      default: 0,
      min: 0,
    },

    violationCounts: {
      type: Schema.Types.Mixed,
      default: {},
    },

    agentProvider: {
      type: String,
      required: true,
    },

    consentGivenAt: {
      type: Date,
    },

    consentVersion: {
      type: String,
      default: "1.0",
    },

    referenceFrame: {
      type: String,
    },

    startedAt: {
      type: Date,
      required: true,
      default: () => new Date(),
    },

    lastSignalAt: {
      type: Date,
    },

    flaggedAt: {
      type: Date,
    },

    endedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "proctoring_sessions",
  }
);

/* -------------------------------------------------------------------------- */
/*                                    Indexes                                  */
/* -------------------------------------------------------------------------- */

/**
 * Recruiter dashboard: sessions for an org, most recent first.
 */
ProctoringSessionSchema.index({
  organizationId: 1,
  createdAt: -1,
});

/**
 * Live monitoring / triage of currently flagged sessions.
 */
ProctoringSessionSchema.index({
  status: 1,
  updatedAt: -1,
});

export const ProctoringSessionModel = model<ProctoringSessionDocument>(
  "ProctoringSession",
  ProctoringSessionSchema
);
