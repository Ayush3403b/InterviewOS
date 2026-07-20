import { Schema, model } from "mongoose";

import {
  ConversationDocument,
  ConversationRole,
  ConversationStatus,
} from "../types/conversation.types";

const ConversationSchema = new Schema<ConversationDocument>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "InterviewSession",
      required: true,
      index: true,
    },

    turnNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    role: {
      type: String,
      enum: Object.values(ConversationRole),
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(ConversationStatus),
      default: ConversationStatus.PENDING,
      required: true,
    },

    question: {
      type: String,
      required: true,
      trim: true,
    },

    answer: {
      type: String,
      trim: true,
      default: "",
    },

    speechTranscript: {
      type: String,
      trim: true,
      default: "",
    },

    timeTaken: {
      type: Number,
      default: 0,
      min: 0,
    },

    tokensUsed: {
      type: Number,
      default: 0,
      min: 0,
    },

    provider: {
      type: String,
      trim: true,
      default: "",
    },

    llmmodel: {
      type: String,
      trim: true,
      default: "",
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "conversations",
  }
);

/* -------------------------------------------------------------------------- */
/*                                   Indexes                                  */
/* -------------------------------------------------------------------------- */

ConversationSchema.index({
  sessionId: 1,
  turnNumber: 1,
});

ConversationSchema.index({
  sessionId: 1,
  createdAt: 1,
});

ConversationSchema.index({
  sessionId: 1,
  status: 1,
});

ConversationSchema.index({
  provider: 1,
});

ConversationSchema.index({
  llmmodel: 1,
});

/* -------------------------------------------------------------------------- */
/*                                    Model                                   */
/* -------------------------------------------------------------------------- */

export const ConversationModel = model<ConversationDocument>(
  "Conversation",
  ConversationSchema
);