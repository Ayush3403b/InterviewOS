import { BaseService } from "../../../shared/services/BaseService";
import { logger } from "../../../shared/logger/logger";

import { AuditLogRepository, AuditLogQuery } from "../repositories/AuditLogRepository";
import { AuditAction } from "../types/audit-log.types";

export interface RecordAuditParams {
  action: AuditAction;
  actorId?: string;
  targetId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Deliberately fire-and-forget: a security-relevant action (login,
 * password reset, a recruiter dismissing a proctoring event) should
 * never fail, or even slow down, because the audit trail had a
 * hiccup. `record()` swallows its own errors - logging them rather
 * than throwing - so a database blip here can never block a login or
 * corrupt an unrelated request.
 */
export default class AuditLogService extends BaseService<AuditLogRepository> {
  async record(params: RecordAuditParams): Promise<void> {
    try {
      await this.repository.record(params);
    } catch (error) {
      logger.warn(
        `Audit log write failed for action=${params.action}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async search(query: AuditLogQuery) {
    return this.repository.search(query);
  }
}
