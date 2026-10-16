import { Schema, model } from "mongoose";

import { ReportDocument } from "../types/report.types";

const SkillScoresSchema = new Schema(
  {
    technical: Number,
    communication: Number,
    problemSolving: Number,
    confidence: Number,
    /** v2+ — will be 0 / absent on older reports. */
    leadership: { type: Number, default: 0 },
    criticalThinking: { type: Number, default: 0 },
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

const RoadmapItemSchema = new Schema(
  {
    topic: String,
    action: String,
    priority: { type: String, enum: ["HIGH", "MEDIUM", "LOW"] },
  },
  { _id: false }
);

const ResourceSchema = new Schema(
  {
    title: String,
    type: { type: String, enum: ["COURSE", "ARTICLE", "PRACTICE", "VIDEO"] },
    reason: String,
    url: String,
  },
  { _id: false }
);

const ReportSchema = new Schema<ReportDocument>(
  {
    interviewSessionId: {
      type: Schema.Types.ObjectId,
      ref: "InterviewSession",
      required: true,
      index: true,
      unique: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    evaluationId: {
      type: Schema.Types.ObjectId,
      ref: "Evaluation",
      required: true,
    },

    candidateName: { type: String, required: true },
    interviewTitle: { type: String, required: true },
    interviewType: { type: String, required: true },
    interviewLevel: { type: String, required: true },

    overallScore: { type: Number, required: true },
    skillScores: { type: SkillScoresSchema, required: true },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    hiringRecommendation: { type: String, required: true },
    overallSummary: { type: String, required: true },
    questionEvaluations: { type: [QuestionEvaluationSchema], default: [] },

    weakTopics: { type: [String], default: [] },
    learningRoadmap: { type: [RoadmapItemSchema], default: [] },
    recommendedResources: { type: [ResourceSchema], default: [] },

    /** Snapshotted from the evaluation at report-generation time. v2+ only. */
    skillGaps: { type: [SkillGapSchema], default: [] },

    executiveSummary: { type: String, required: true },
    candidateFeedback: { type: String, default: "" },
    recruiterBrief: { type: String, default: "" },
    executiveDigest: { type: String, default: "" },

    shareToken: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    shareExpiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "reports",
  }
);

export const ReportModel = model<ReportDocument>("Report", ReportSchema);
