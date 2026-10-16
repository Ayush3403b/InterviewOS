import { Response } from "express";

import { BaseController } from "../../../shared/http/BaseController";
import { AuthenticatedRequest } from "../../../shared/security/AuthenticatedRequest";

import InterviewContextService from "../services/InterviewContextService";

export default class InterviewContextController extends BaseController {
  constructor(private readonly service: InterviewContextService) {
    super();
  }

  public getContext = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const sessionId = Array.isArray(req.params.sessionId)
      ? req.params.sessionId[0]
      : req.params.sessionId;

    const context = await this.service.getContext(sessionId);

    this.ok(res, "Interview context fetched.", context);
  };
}
