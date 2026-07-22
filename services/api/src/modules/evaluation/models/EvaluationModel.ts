import { Schema, model } from "mongoose";

import {
  EvaluationDocument,
  EvaluationStatus,
} from "../types/evaluation.types";

const EvaluationSchema = new Schema<EvaluationDocument>(
  {
    /**
     * Associated Interview Session
     */
    interviewSessionId: {
      type: Schema.Types.ObjectId,
      ref: "InterviewSession",
      required: true,
      unique: true,
      index: true,
    },

    /**
     * Organization
     */
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    /**
     * Candidate
     */
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /**
     * Current Evaluation Status
     */
    status: {
      type: String,
      enum: Object.values(EvaluationStatus),
      default: EvaluationStatus.NOT_STARTED,
      required: true,
    },

    /**
     * Final Overall Score
     */
    overallScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    /**
     * Category-wise Scores
     */
    scores: {
      communication: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },

      technical: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },

      problemSolving: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },

      confidence: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
    },

    /**
     * AI Generated Evaluation Feedback
     */
    feedback: {
      type: String,
      trim: true,
      default: "",
    },

    /**
     * AI Provider
     */
    provider: {
      type: String,
      trim: true,
      default: "",
    },

    /**
     * LLM Model
     */
    llmModel: {
      type: String,
      trim: true,
      default: "",
    },

    /**
     * Tokens Consumed
     */
    tokensUsed: {
      type: Number,
      default: 0,
      min: 0,
    },

    /**
     * Evaluation Duration (ms)
     */
    evaluationTime: {
      type: Number,
      default: 0,
      min: 0,
    },

    /**
     * Additional Provider Metadata
     */
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },

    /**
     * Published Time
     */
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "evaluations",
  }
);

/* -------------------------------------------------------------------------- */
/*                                   Indexes                                  */
/* -------------------------------------------------------------------------- */

/**
 * Fetch Evaluation by Interview Session
 */
EvaluationSchema.index({
  interviewSessionId: 1,
});

/**
 * Candidate Evaluation History
 */
EvaluationSchema.index({
  candidateId: 1,
  createdAt: -1,
});

/**
 * Organization Evaluation Dashboard
 */
EvaluationSchema.index({
  organizationId: 1,
  createdAt: -1,
});

/**
 * Status Filter
 */
EvaluationSchema.index({
  status: 1,
});

/**
 * AI Provider Analytics
 */
EvaluationSchema.index({
  provider: 1,
});

/**
 * AI Model Analytics
 */
EvaluationSchema.index({
  llmModel: 1,
});

/* -------------------------------------------------------------------------- */
/*                                    Model                                   */
/* -------------------------------------------------------------------------- */

export const EvaluationModel = model<EvaluationDocument>(
  "Evaluation",
  EvaluationSchema
);