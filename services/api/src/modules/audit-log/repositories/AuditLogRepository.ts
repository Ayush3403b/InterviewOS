import { FilterQuery, Types } from "mongoose";

import { BaseRepository } from "../../../database/BaseRepository";

import { AuditLogModel } from "../models/AuditLogModel";
import { AuditAction, AuditLogDocument } from "../types/audit-log.types";

export interface AuditLogQuery {
  action?: AuditAction;
  actorId?: string;
  page?: number;
  limit?: number;
}

export class AuditLogRepository extends BaseRepository<AuditLogDocument> {
  constructor() {
    super(AuditLogModel);
  }

  async record(data: {
    action: AuditAction;
    actorId?: string;
    targetId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.model.create({
      ...data,
      actorId: data.actorId ? new Types.ObjectId(data.actorId) : undefined,
    });
  }

  async search({ action, actorId, page = 1, limit = 50 }: AuditLogQuery) {
    const filter: FilterQuery<AuditLogDocument> = {};

    if (action) {
      filter.action = action;
    }
    if (actorId) {
      filter.actorId = new Types.ObjectId(actorId);
    }

    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      this.model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      this.model.countDocuments(filter),
    ]);

    return { entries, total, page, limit };
  }
}
