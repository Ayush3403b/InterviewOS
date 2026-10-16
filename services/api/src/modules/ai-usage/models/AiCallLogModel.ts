import { Schema, model } from "mongoose";

import { AiCallLogDocument } from "../types/ai-usage.types";

const AiCallLogSchema = new Schema<AiCallLogDocument>(
  {
    provider: { type: String, required: true, index: true },

    modelName: { type: String, required: true },

    promptId: { type: String, required: true, index: true },

    promptVersion: { type: String, required: true },

    tokensUsed: { type: Number },

    estimatedCostUsd: { type: Number },

    latencyMs: { type: Number, required: true },

    success: { type: Boolean, required: true },

    errorMessage: { type: String },

    interviewSessionId: {
      type: Schema.Types.ObjectId,
      ref: "InterviewSession",
      index: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
    collection: "ai_call_logs",
  }
);

/**
 * Auto-delete detailed LLM call logs after 90 days.
 */
AiCallLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 }
);

export const AiCallLogModel = model<AiCallLogDocument>(
  "AiCallLog",
  AiCallLogSchema
);
