import { Schema, model } from "mongoose";

import {
  MCQ_LIMITS,
  McqDifficulty,
  McqQuestion,
  McqQuestionSource,
  McqTestDocument,
  McqTestStatus,
} from "../types/mcq-test.types";

const McqQuestionSchema = new Schema<McqQuestion>({
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: MCQ_LIMITS.questionMaxLength,
  },

  options: {
    type: [String],
    required: true,
    validate: {
      validator: (options: string[]) =>
        options.length >= MCQ_LIMITS.minOptions &&
        options.length <= MCQ_LIMITS.maxOptions,
      message: `A question needs ${MCQ_LIMITS.minOptions}-${MCQ_LIMITS.maxOptions} options.`,
    },
  },

  correctOptionIndex: {
    type: Number,
    required: true,
    min: 0,
    max: MCQ_LIMITS.maxOptions - 1,
  },

  explanation: {
    type: String,
    trim: true,
    maxlength: MCQ_LIMITS.explanationMaxLength,
  },

  topic: {
    type: String,
    trim: true,
    maxlength: 200,
  },

  difficulty: {
    type: String,
    enum: Object.values(McqDifficulty),
    default: McqDifficulty.MEDIUM,
  },

  points: {
    type: Number,
    default: 1,
    min: 1,
    max: MCQ_LIMITS.maxPoints,
  },

  source: {
    type: String,
    enum: Object.values(McqQuestionSource),
    default: McqQuestionSource.MANUAL,
  },
});

const McqTestSchema = new Schema<McqTestDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    instructions: {
      type: String,
      trim: true,
      maxlength: 4000,
    },

    createdBy: {
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
      enum: Object.values(McqTestStatus),
      default: McqTestStatus.DRAFT,
      required: true,
    },

    durationMinutes: {
      type: Number,
      required: true,
      min: MCQ_LIMITS.minDurationMinutes,
      max: MCQ_LIMITS.maxDurationMinutes,
    },

    passPercentage: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },

    shuffleQuestions: {
      type: Boolean,
      default: true,
    },

    shuffleOptions: {
      type: Boolean,
      default: true,
    },

    showScoreToCandidate: {
      type: Boolean,
      default: true,
    },

    accessCode: {
      type: String,
    },

    questions: {
      type: [McqQuestionSchema],
      default: [],
    },

    publishedAt: {
      type: Date,
    },

    closedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "mcq_tests",
  }
);

/* -------------------------------------------------------------------------- */
/*                                    Indexes                                  */
/* -------------------------------------------------------------------------- */

/** Candidates join by code. Drafts have none, hence partial. */
McqTestSchema.index(
  { accessCode: 1 },
  { unique: true, partialFilterExpression: { accessCode: { $type: "string" } } }
);

/** "My tests" listing for the author. */
McqTestSchema.index({ createdBy: 1, createdAt: -1 });

export const McqTestModel = model<McqTestDocument>("McqTest", McqTestSchema);
