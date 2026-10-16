import { Response } from "express";

import { BaseController } from "../../../shared/http/BaseController";

import { AuthenticatedRequest } from "../../../shared/security/AuthenticatedRequest";

import { ApiError } from "../../../shared/errors/ApiError";
import { ErrorCode } from "../../../shared/errors/ErrorCode";

import EvaluationService from "../services/EvaluationService";

import { EvaluationResponseMapper } from "../responses/EvaluationResponseMapper";

import { CreateEvaluationDto } from "../dtos/CreateEvaluationDto";
import { UpdateEvaluationDto } from "../dtos/UpdateEvaluationDto";

export default class EvaluationController extends BaseController {

  constructor(
    private readonly evaluationService: EvaluationService
  ) {
    super();
  }

  /* -------------------------------------------------------------------------- */
  /*                               Helper                                       */
  /* -------------------------------------------------------------------------- */

  private getAuthenticatedUserId(
    req: AuthenticatedRequest
  ): string {

    const userId = req.user?.sub;

    if (!userId) {
      throw new ApiError(
        401,
        "Authentication required",
        ErrorCode.UNAUTHORIZED
      );
    }

    return userId;
  }

  /* -------------------------------------------------------------------------- */
  /*                           Create Evaluation                                */
  /* -------------------------------------------------------------------------- */

  public createEvaluation = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {

    const evaluation =
      await this.evaluationService.createEvaluation(
        req.body as CreateEvaluationDto
      );

    this.created(
      res,
      "Evaluation created successfully.",
      EvaluationResponseMapper.toResponse(
        evaluation
      )
    );

    return;
  };

  /* -------------------------------------------------------------------------- */
  /*                           Get Evaluation                                   */
  /* -------------------------------------------------------------------------- */

  public getEvaluationById = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {

    const id =
      Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

    const userId =
      this.getAuthenticatedUserId(req);

    const evaluation =
      await this.evaluationService.getEvaluationById(
        id,
        userId
      );

    this.ok(
      res,
      "Evaluation fetched successfully.",
      EvaluationResponseMapper.toResponse(
        evaluation
      )
    );

    return;
  };

  /* -------------------------------------------------------------------------- */
  /*                    Get Evaluation By Interview                             */
  /* -------------------------------------------------------------------------- */

  public getEvaluationByInterview = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {

    const interviewId =
      Array.isArray(req.params.interviewId)
        ? req.params.interviewId[0]
        : req.params.interviewId;

    const evaluation =
      await this.evaluationService.getEvaluationByInterview(
        interviewId
      );

    if (!evaluation) {
      throw new ApiError(
        404,
        "Evaluation not found.",
        ErrorCode.NOT_FOUND
      );
    }

    this.ok(
      res,
      "Evaluation fetched successfully.",
      EvaluationResponseMapper.toResponse(
        evaluation
      )
    );

    return;
  };

  /* -------------------------------------------------------------------------- */
  /*                    Candidate Evaluations                                   */
  /* -------------------------------------------------------------------------- */

  public getCandidateEvaluations = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {

    const candidateId =
      Array.isArray(req.params.candidateId)
        ? req.params.candidateId[0]
        : req.params.candidateId;

    const evaluations =
      await this.evaluationService.getCandidateEvaluations(
        candidateId
      );

    this.ok(
      res,
      "Candidate evaluations fetched successfully.",
      EvaluationResponseMapper.toResponseList(
        evaluations
      )
    );

    return;
  };

  /* -------------------------------------------------------------------------- */
  /*                  Organization Evaluations                                  */
  /* -------------------------------------------------------------------------- */

  public getOrganizationEvaluations = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {

    const organizationId =
      Array.isArray(req.params.organizationId)
        ? req.params.organizationId[0]
        : req.params.organizationId;

    const evaluations =
      await this.evaluationService.getOrganizationEvaluations(
        organizationId
      );

    this.ok(
      res,
      "Organization evaluations fetched successfully.",
      EvaluationResponseMapper.toResponseList(
        evaluations
      )
    );

    return;
  };

  /* -------------------------------------------------------------------------- */
  /*                       Generate Evaluation                                  */
  /* -------------------------------------------------------------------------- */

  public generateEvaluation = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {

    const id =
      Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

    const evaluation =
      await this.evaluationService.generateEvaluation(
        id
      );

    this.ok(
      res,
      "Evaluation generated successfully.",
      EvaluationResponseMapper.toResponse(
        evaluation
      )
    );

    return;
  };

  /* -------------------------------------------------------------------------- */
  /*                        Update Evaluation                                   */
  /* -------------------------------------------------------------------------- */

  public updateEvaluation = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {

    const id =
      Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

    const evaluation =
      await this.evaluationService.updateEvaluation(
        id,
        req.body as UpdateEvaluationDto
      );

    if (!evaluation) {
      throw new ApiError(
        404,
        "Evaluation not found.",
        ErrorCode.NOT_FOUND
      );
    }

    this.ok(
      res,
      "Evaluation updated successfully.",
      EvaluationResponseMapper.toResponse(
        evaluation
      )
    );

    return;
  };

  /* -------------------------------------------------------------------------- */
  /*                       Publish Evaluation                                   */
  /* -------------------------------------------------------------------------- */

  public publishEvaluation = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {

    const id =
      Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

    const evaluation =
      await this.evaluationService.publishEvaluation(
        id
      );

    if (!evaluation) {
      throw new ApiError(
        404,
        "Evaluation not found.",
        ErrorCode.NOT_FOUND
      );
    }

    this.ok(
      res,
      "Evaluation published successfully.",
      EvaluationResponseMapper.toResponse(
        evaluation
      )
    );

    return;
  };

  /* -------------------------------------------------------------------------- */
  /*                         Reset Evaluation                                   */
  /* -------------------------------------------------------------------------- */

  public resetEvaluation = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {

    const id =
      Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

    const evaluation =
      await this.evaluationService.resetEvaluation(
        id
      );

    if (!evaluation) {
      throw new ApiError(
        404,
        "Evaluation not found.",
        ErrorCode.NOT_FOUND
      );
    }

    this.ok(
      res,
      "Evaluation reset successfully.",
      EvaluationResponseMapper.toResponse(
        evaluation
      )
    );

    return;
  };

  public getCandidateStatistics = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {

    const candidateId = Array.isArray(req.params.candidateId)
      ? req.params.candidateId[0]
      : req.params.candidateId;

    const statistics =
      await this.evaluationService.getCandidateStatistics(
        candidateId
      );

    this.ok(
      res,
      "Candidate statistics fetched successfully.",
      statistics
    );

    return;
  };

  public getOrganizationStatistics = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {

    const organizationId = Array.isArray(req.params.organizationId)
      ? req.params.organizationId[0]
      : req.params.organizationId;

    const statistics =
      await this.evaluationService.getOrganizationStatistics(
        organizationId
      );

    this.ok(
      res,
      "Organization statistics fetched successfully.",
      statistics
    );

    return;
  };

  /* -------------------------------------------------------------------------- */
  /*                         Delete Evaluation                                  */
  /* -------------------------------------------------------------------------- */

  public deleteEvaluation = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {

    const id =
      Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

    await this.evaluationService.deleteEvaluation(
      id
    );

    this.ok(
      res,
      "Evaluation deleted successfully."
    );

    return;
  };
}