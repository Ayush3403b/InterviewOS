import { Schema, model } from "mongoose";

import {
  McqAttemptDocument,
  McqAttemptQuestion,
  McqAttemptResult,
  McqAttemptStatus,
  McqSubmitReason,
} from "../types/mcq-test.types";

const McqAttemptQuestionSchema = new Schema<McqAttemptQuestion>(
  {
    questionId: { type: Schema.Types.ObjectId, required: true },
    text: { type: String, required: true },
    options: { type: [String], required: true },
    correctOptionIndex: { type: Number, required: true },
    optionOrder: { type: [Number], required: true },
    points: { type: Number, required: true },
    topic: { type: String },
    explanation: { type: String },
  },
  { _id: false }
);

const McqAttemptResultSchema = new Schema<McqAttemptResult>(
  {
    score: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    percentage: { type: Number, required: true },
    passed: { type: Boolean, required: true },
    correctCount: { type: Number, required: true },
    answeredCount: { type: Number, required: true },
  },
  { _id: false }
);

const McqAttemptSchema = new Schema<McqAttemptDocument>(
  {
    testId: {
      type: Schema.Types.ObjectId,
      ref: "McqTest",
      required: true,
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
      enum: Object.values(McqAttemptStatus),
      default: McqAttemptStatus.IN_PROGRESS,
      required: true,
    },

    startedAt: {
      type: Date,
      required: true,
    },

    deadlineAt: {
      type: Date,
      required: true,
    },

    submittedAt: {
      type: Date,
    },

    submitReason: {
      type: String,
      enum: Object.values(McqSubmitReason),
    },

    testTitle: {
      type: String,
      required: true,
    },

    passPercentage: {
      type: Number,
      required: true,
    },

    showScoreToCandidate: {
      type: Boolean,
      required: true,
    },

    questions: {
      type: [McqAttemptQuestionSchema],
      default: [],
    },

    answers: {
      type: Map,
      of: Number,
      default: {},
    },

    result: {
      type: McqAttemptResultSchema,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "mcq_attempts",
  }
);

/* -------------------------------------------------------------------------- */
/*                                    Indexes                                  */
/* -------------------------------------------------------------------------- */

/** One attempt per candidate per test - also the test's results listing. */
McqAttemptSchema.index({ testId: 1, candidateId: 1 }, { unique: true });

export const McqAttemptModel = model<McqAttemptDocument>(
  "McqAttempt",
  McqAttemptSchema
);
