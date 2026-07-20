import { Schema, model } from "mongoose";

import {
  InterviewLevel,
  InterviewSessionDocument,
  InterviewStatus,
  InterviewType,
} from "../types/interview-session.types";

const InterviewSessionSchema = new Schema<InterviewSessionDocument>(
  {
    /**
     * Interview Owner
     */
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /**
     * User defined title
     */
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    /**
     * Interview Category
     */
    type: {
      type: String,
      enum: Object.values(InterviewType),
      required: true,
    },

    /**
     * Selected interview difficulty
     */
    level: {
      type: String,
      enum: Object.values(InterviewLevel),
      required: true,
    },

    /**
     * Current Interview Status
     */
    status: {
      type: String,
      enum: Object.values(InterviewStatus),
      default: InterviewStatus.CREATED,
      required: true,
    },

    /**
     * Duration in seconds
     */
    duration: {
      type: Number,
      default: 0,
      min: 0,
    },

    /**
     * Number of completed AI ↔ Candidate turns
     */
    turnCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    /**
     * Maximum interview turns
     */
    maxQuestions: {
      type: Number,
      default: 10,
      min: 1,
      max: 50,
    },

    /**
     * Final Interview Score
     */
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    /**
     * AI Generated Final Feedback
     */
    feedback: {
      type: String,
      trim: true,
      default: "",
    },

    /**
     * Interview Started Time
     */
    startedAt: {
      type: Date,
      default: null,
    },

    /**
     * Interview Completed Time
     */
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "interview_sessions",
  }
);

/* -------------------------------------------------------------------------- */
/*                                    Indexes                                 */
/* -------------------------------------------------------------------------- */

/**
 * Dashboard
 * Get all interviews of a user
 */
InterviewSessionSchema.index({
  userId: 1,
  createdAt: -1,
});

/**
 * Active Interview Lookup
 */
InterviewSessionSchema.index({
  userId: 1,
  status: 1,
});

/**
 * Filter by Type
 */
InterviewSessionSchema.index({
  userId: 1,
  type: 1,
});

/**
 * Filter by Level
 */
InterviewSessionSchema.index({
  userId: 1,
  level: 1,
});

/**
 * Analytics
 */
InterviewSessionSchema.index({
  createdAt: -1,
});

/* -------------------------------------------------------------------------- */
/*                                   Export                                   */
/* -------------------------------------------------------------------------- */

export const InterviewSessionModel = model<InterviewSessionDocument>(
  "InterviewSession",
  InterviewSessionSchema
);