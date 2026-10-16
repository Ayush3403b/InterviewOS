import { Schema, model } from "mongoose";

import { CoachingPlanDocument } from "../types/coach.types";

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

const CoachingPlanSchema = new Schema<CoachingPlanDocument>(
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

    personalizedFeedback: {
      type: String,
      required: true,
    },

    weakTopics: {
      type: [String],
      default: [],
    },

    learningRoadmap: {
      type: [RoadmapItemSchema],
      default: [],
    },

    recommendedResources: {
      type: [ResourceSchema],
      default: [],
    },

    careerGuidance: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "coaching_plans",
  }
);

export const CoachingPlanModel = model<CoachingPlanDocument>(
  "CoachingPlan",
  CoachingPlanSchema
);
