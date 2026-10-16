import { Response } from "express";

import { BaseController } from "../../../shared/http/BaseController";
import { AuthenticatedRequest } from "../../../shared/security/AuthenticatedRequest";
import { ApiError } from "../../../shared/errors/ApiError";
import { ErrorCode } from "../../../shared/errors/ErrorCode";

import McqTestService, { GenerationOutcome, TestWithCounts } from "../services/McqTestService";
import McqAttemptService from "../services/McqAttemptService";
import { Requester } from "../services/testAccess";
import { UploadedMaterialFile } from "../services/prepareStudyMaterial";

import { McqTestResponse } from "../responses/McqTestResponse";

import { parseBody } from "../validations/parseBody";
import {
  CreateMcqTestBody,
  GenerateFromTopicsBody,
  ImportFromMaterialBody,
  ReplaceQuestionsBody,
  UpdateMcqTestBody,
} from "../validations/McqTest.validation";

/**
 * Test authors (recruiter/faculty/admin - gated in the routes): build
 * tests, generate questions, publish, and review results.
 */
export default class McqTestController extends BaseController {
  constructor(
    private readonly mcqTestService: McqTestService,
    private readonly mcqAttemptService: McqAttemptService
  ) {
    super();
  }

  private getRequester(req: AuthenticatedRequest): Requester {
    const userId = req.user?.sub;

    if (!userId) {
      throw new ApiError(401, "Authentication required", ErrorCode.UNAUTHORIZED);
    }

    return { userId, role: req.user?.role };
  }

  private param(req: AuthenticatedRequest, name: string): string {
    const value = req.params[name];
    return Array.isArray(value) ? value[0] : value;
  }

  private detail({ test, counts }: TestWithCounts) {
    return McqTestResponse.toTestDetail(test, counts);
  }

  private generation(outcome: GenerationOutcome) {
    return {
      test: this.detail(outcome),
      addedCount: outcome.addedCount,
      mode: outcome.mode ?? null,
      truncated: outcome.truncated ?? false,
    };
  }

  /* -------------------------------------------------------------------------- */
  /*                                    CRUD                                     */
  /* -------------------------------------------------------------------------- */

  public createTest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { userId } = this.getRequester(req);

    const test = await this.mcqTestService.createTest(
      parseBody(CreateMcqTestBody, req.body),
      userId
    );

    this.created(
      res,
      "Test created.",
      McqTestResponse.toTestDetail(test, { total: 0, submitted: 0 })
    );
  };

  public listMyTests = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { userId } = this.getRequester(req);

    const tests = await this.mcqTestService.listMyTests(userId);

    this.ok(
      res,
      "Tests fetched.",
      tests.map(({ test, counts }) => McqTestResponse.toTestSummary(test, counts))
    );
  };

  public getTest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const result = await this.mcqTestService.getTest(
      this.param(req, "id"),
      this.getRequester(req)
    );

    this.ok(res, "Test fetched.", this.detail(result));
  };

  public updateTest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const result = await this.mcqTestService.updateTest(
      this.param(req, "id"),
      parseBody(UpdateMcqTestBody, req.body),
      this.getRequester(req)
    );

    this.ok(res, "Test updated.", this.detail(result));
  };

  public deleteTest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    await this.mcqTestService.deleteTest(this.param(req, "id"), this.getRequester(req));

    this.ok(res, "Test deleted.");
  };

  /* -------------------------------------------------------------------------- */
  /*                                  Questions                                  */
  /* -------------------------------------------------------------------------- */

  public replaceQuestions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { questions } = parseBody(ReplaceQuestionsBody, req.body);

    const result = await this.mcqTestService.replaceQuestions(
      this.param(req, "id"),
      questions,
      this.getRequester(req)
    );

    this.ok(res, "Questions saved.", this.detail(result));
  };

  public generateFromTopics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const outcome = await this.mcqTestService.generateFromTopics(
      this.param(req, "id"),
      parseBody(GenerateFromTopicsBody, req.body),
      this.getRequester(req)
    );

    this.ok(
      res,
      `Added ${outcome.addedCount} AI-generated question(s).`,
      this.generation(outcome)
    );
  };

  public importFromMaterial = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const files = (req.files as UploadedMaterialFile[] | undefined) ?? [];

    const outcome = await this.mcqTestService.importFromMaterial(
      this.param(req, "id"),
      files,
      parseBody(ImportFromMaterialBody, req.body),
      this.getRequester(req)
    );

    this.ok(
      res,
      `Added ${outcome.addedCount} question(s) from your files.`,
      this.generation(outcome)
    );
  };

  /* -------------------------------------------------------------------------- */
  /*                                  Lifecycle                                  */
  /* -------------------------------------------------------------------------- */

  public publishTest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const result = await this.mcqTestService.publishTest(
      this.param(req, "id"),
      this.getRequester(req)
    );

    this.ok(res, "Test published.", this.detail(result));
  };

  public closeTest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const result = await this.mcqTestService.closeTest(
      this.param(req, "id"),
      this.getRequester(req)
    );

    this.ok(res, "Test closed.", this.detail(result));
  };

  public reopenTest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const result = await this.mcqTestService.reopenTest(
      this.param(req, "id"),
      this.getRequester(req)
    );

    this.ok(res, "Test reopened.", this.detail(result));
  };

  public revertToDraft = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const result = await this.mcqTestService.revertToDraft(
      this.param(req, "id"),
      this.getRequester(req)
    );

    this.ok(res, "Test moved back to draft.", this.detail(result));
  };

  /* -------------------------------------------------------------------------- */
  /*                                   Results                                   */
  /* -------------------------------------------------------------------------- */

  public listResults = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { test, attempts } = await this.mcqAttemptService.listAttemptsForTest(
      this.param(req, "id"),
      this.getRequester(req)
    );

    this.ok(res, "Results fetched.", {
      test: {
        id: test._id.toString(),
        title: test.title,
        status: test.status,
        passPercentage: test.passPercentage,
        questionCount: test.questions.length,
      },
      attempts: attempts.map(({ attempt, proctoring }) =>
        McqTestResponse.toResultRow(attempt, proctoring)
      ),
    });
  };

  public getAttemptReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { test, attempt } = await this.mcqAttemptService.getAttemptForReview(
      this.param(req, "id"),
      this.param(req, "attemptId"),
      this.getRequester(req)
    );

    this.ok(res, "Attempt fetched.", McqTestResponse.toAttemptReview(test, attempt));
  };
}
