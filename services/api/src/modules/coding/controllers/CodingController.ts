import { Response } from "express";
import { BaseController } from "../../../shared/http/BaseController";
import { AuthenticatedRequest } from "../../../shared/security/AuthenticatedRequest";
import { ApiError } from "../../../shared/errors/ApiError";
import { ErrorCode } from "../../../shared/errors/ErrorCode";
import CodeSandboxService from "../services/CodeSandboxService";
import { CodeExecutionRequest, TestCase } from "../types/codeSandbox.types";

export default class CodingController extends BaseController {
  constructor(private readonly codeSandboxService: CodeSandboxService) {
    super();
  }

  private ensureAuthenticated(req: AuthenticatedRequest): void {
    if (!req.user?.sub) {
      throw new ApiError(401, "Authentication required", ErrorCode.UNAUTHORIZED);
    }
  }

  public execute = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    this.ensureAuthenticated(req);

    const body = req.body as CodeExecutionRequest;

    const result = await this.codeSandboxService.execute(body);

    this.ok(res, "Code executed successfully.", result);
  };

  public runTestCases = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    this.ensureAuthenticated(req);

    const { language, code, testCases, timeoutMs } = req.body as {
      language: CodeExecutionRequest["language"];
      code: string;
      testCases: TestCase[];
      timeoutMs?: number;
    };

    const result = await this.codeSandboxService.runTestCases(
      language,
      code,
      testCases,
      timeoutMs
    );

    this.ok(res, "Test cases evaluated.", result);
  };
}
