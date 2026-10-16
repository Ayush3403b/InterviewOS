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

    leadership: { type: Number, default: 0, min: 0, max: 100 },

    criticalThinking: { type: Number, default: 0, min: 0, max: 100 },
  },
  { _id: false }
);

const SkillGapSchema = new Schema(
  {
    skill: { type: String, required: true },
    currentLevel: { type: Number, required: true, min: 0, max: 100 },
    targetLevel: { type: Number, required: true, min: 0, max: 100 },
    priority: { type: String, enum: ["high", "medium", "low"], required: true },
    actionableSteps: { type: [String], default: [] },
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
        required: false,
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
          leadership: 0,
          criticalThinking: 0,
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

      skillGaps: {
        type: [SkillGapSchema],
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