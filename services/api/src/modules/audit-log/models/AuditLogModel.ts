import { Schema, model } from "mongoose";

import { AuditAction, AuditLogDocument } from "../types/audit-log.types";

const AuditLogSchema = new Schema<AuditLogDocument>(
  {
    action: {
      type: String,
      enum: Object.values(AuditAction),
      required: true,
      index: true,
    },

    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    targetId: { type: String },

    ipAddress: { type: String },
    userAgent: { type: String },

    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
    collection: "audit_logs",
  }
);

/** The read endpoint's primary access pattern: recent events, optionally by actor. */
AuditLogSchema.index({ actorId: 1, createdAt: -1 });

export const AuditLogModel = model<AuditLogDocument>(
  "AuditLog",
  AuditLogSchema
);
