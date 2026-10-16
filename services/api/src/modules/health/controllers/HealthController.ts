import { Request, Response } from "express";

import { BaseController } from "../../../shared/http/BaseController";
import { ApiResponse } from "../../../shared/http/ApiResponse";

class HealthController extends BaseController {
  public getHealth = (req: Request, res: Response): Response => {
    return res.status(200).json(
      ApiResponse.success("InterviewOS API is healthy", {
        status: "OK",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV ?? "development",
      })
    );
  };
}

export default new HealthController();