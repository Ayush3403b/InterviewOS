import { Schema, model } from "mongoose";

import { InterviewContextDocument } from "../types/interview-context.types";

const InterviewContextSchema = new Schema<InterviewContextDocument>(
  {
    interviewSessionId: {
      type: Schema.Types.ObjectId,
      ref: "InterviewSession",
      required: true,
      unique: true,
      index: true,
    },

    resumeSummary: {
      type: String,
    },

    transcriptSummary: {
      type: String,
      default: "",
    },

    topicsCovered: {
      type: [String],
      default: [],
    },

    difficultyHistory: {
      type: [String],
      default: [],
    },

    answerQualityHistory: {
      type: [Number],
      default: [],
    },

    notes: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "interview_contexts",
  }
);

export const InterviewContextModel = model<InterviewContextDocument>(
  "InterviewContext",
  InterviewContextSchema
);
