import { AuditLogDocument } from "../types/audit-log.types";

export class AuditLogResponse {
  static toEntry(entry: AuditLogDocument) {
    return {
      id: entry._id,
      action: entry.action,
      actorId: entry.actorId,
      targetId: entry.targetId,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      metadata: entry.metadata,
      createdAt: entry.createdAt,
    };
  }

  static toList(result: {
    entries: AuditLogDocument[];
    total: number;
    page: number;
    limit: number;
  }) {
    return {
      entries: result.entries.map((entry) => this.toEntry(entry)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }
}
