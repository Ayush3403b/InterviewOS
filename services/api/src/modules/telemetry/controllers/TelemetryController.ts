import { Response } from "express";

import { BaseController } from "../../../shared/http/BaseController";
import { AuthenticatedRequest } from "../../../shared/security/AuthenticatedRequest";
import { ErrorTelemetry } from "../../../shared/telemetry/ErrorTelemetry";

export default class TelemetryController extends BaseController {
  public getErrorSummary = async (
    _req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const summary = ErrorTelemetry.getSummary();

    this.ok(res, "Telemetry error summary retrieved successfully.", summary);
  };
}
