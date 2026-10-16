import { Response } from "express";

import { BaseController } from "../../../shared/http/BaseController";
import { AuthenticatedRequest } from "../../../shared/security/AuthenticatedRequest";

import AuditLogService from "../services/AuditLogService";
import { AuditLogResponse } from "../responses/AuditLogResponse";
import { AuditAction } from "../types/audit-log.types";

export default class AuditLogController extends BaseController {
  constructor(private readonly auditLogService: AuditLogService) {
    super();
  }

  /**
   * Read-only. Access control lives in AuditLogRoutes.ts (recruiter/
   * admin/super_admin only) - this controller just parses filters.
   */
  public search = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<Response> => {
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 50, 200);

    const action =
      typeof req.query.action === "string"
        ? (req.query.action as AuditAction)
        : undefined;

    const actorId =
      typeof req.query.actorId === "string" ? req.query.actorId : undefined;

    const result = await this.auditLogService.search({
      action,
      actorId,
      page,
      limit,
    });

    return this.ok(
      res,
      "Audit log fetched successfully.",
      AuditLogResponse.toList(result)
    );
  };
}
