import { Schema, model } from "mongoose";

import {
  EvaluationDocument,
  EvaluationStatus,
  HiringRecommendation,
} from "../types/evaluation.types";

const SkillScoreSchema = new Schema(
  {
    technical: { type: Number, default: 0, min: 0, max: 100 },

    communication: { type: Number, default: 0, min: 0, max: 100 },

    problemSolving: { type: Number, default: 0, min: 0, max: 100 },

    confidence: { type: Number, default: 0, min: 0, max: 100 },
  },
  { _id: false }
);

const QuestionEvaluationSchema = new Schema(
  {
    turnNumber: Number,

    question: String,

    answer: String,

    score: Number,

    feedback: String,
  },
  { _id: false }
);

const EvaluationSchema =
  new Schema<EvaluationDocument>(
    {
      interviewSessionId: {
        type: Schema.Types.ObjectId,
        ref: "InterviewSession",
        required: true,
        unique: true,
      },

      organizationId: {
        type: Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
      },

      candidateId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      status: {
        type: String,
        enum: Object.values(EvaluationStatus),
        default: EvaluationStatus.NOT_STARTED,
      },

      overallScore: {
        type: Number,
        default: 0,
      },

      skillScores: {
        type: SkillScoreSchema,
        default: () => ({
          technical: 0,
          communication: 0,
          problemSolving: 0,
          confidence: 0,
        }),
      },

      strengths: {
        type: [String],
        default: [],
      },

      weaknesses: {
        type: [String],
        default: [],
      },

      recommendations: {
        type: [String],
        default: [],
      },

      overallSummary: {
        type: String,
        default: "",
      },

      hiringRecommendation: {
        type: String,
        enum: Object.values(HiringRecommendation),
        default: HiringRecommendation.BORDERLINE,
      },

      questionEvaluations: {
        type: [QuestionEvaluationSchema],
        default: [],
      },

      metadata: {
        type: Schema.Types.Mixed,
        default: {},
      },

      publishedAt: Date,
    },
    {
      timestamps: true,
      versionKey: false,
    }
  );

export const EvaluationModel = model<EvaluationDocument>(
  "Evaluation",
  EvaluationSchema
);