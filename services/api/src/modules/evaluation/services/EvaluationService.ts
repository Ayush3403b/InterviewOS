import { Types } from "mongoose";

import { BaseService } from "../../../shared/services/BaseService";

import { ApiError } from "../../../shared/errors/ApiError";
import { ErrorCode } from "../../../shared/errors/ErrorCode";

import { EvaluationRepository } from "../repositories/EvaluationRepository";
import { ConversationRepository } from "../../conversation/repositories/ConversationRepository";
import { InterviewSessionRepository } from "../../interview-session/repositories/InterviewSessionRepository";

import { IEvaluationAgent } from "../../../agents/evaluation/IEvaluationAgent";

import { CreateEvaluationDto } from "../dtos/CreateEvaluationDto";
import { UpdateEvaluationDto } from "../dtos/UpdateEvaluationDto";

import {
  EvaluationDocument,
  EvaluationStatus,
} from "../types/evaluation.types";

export default class EvaluationService extends BaseService<EvaluationRepository> {

  constructor(
    repository: EvaluationRepository,
    private readonly conversationRepository: ConversationRepository,
    private readonly interviewRepository: InterviewSessionRepository,
    private readonly evaluationAgent: IEvaluationAgent
  ) {
    super(repository);
  }

  /* -------------------------------------------------------------------------- */
  /*                              Private Helpers                               */
  /* -------------------------------------------------------------------------- */

  /**
   * Validate Mongo ObjectId
   */
  private ensureValidObjectId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(
        400,
        "Invalid resource id.",
        ErrorCode.BAD_REQUEST
      );
    }
  }

  /**
   * Ensure evaluation exists
   */
  private async ensureEvaluationExists(
    id: string
  ): Promise<EvaluationDocument> {

    this.ensureValidObjectId(id);

    const evaluation =
      await this.repository.findById(id);

    if (!evaluation) {
      throw new ApiError(
        404,
        "Evaluation not found.",
        ErrorCode.NOT_FOUND
      );
    }

    return evaluation;
  }

  /**
   * Ensure evaluation belongs to candidate
   */
  private async ensureOwner(
    evaluation: EvaluationDocument,
    candidateId: string
  ): Promise<void> {

    if (
      evaluation.candidateId.toString() !== candidateId
    ) {
      throw new ApiError(
        403,
        "You are not allowed to access this evaluation.",
        ErrorCode.FORBIDDEN
      );
    }
  }

  /**
   * Ensure evaluation has expected status
   */
  private ensureStatus(
    evaluation: EvaluationDocument,
    allowed: EvaluationStatus[]
  ): void {

    if (
      !allowed.includes(evaluation.status)
    ) {
      throw new ApiError(
        409,
        `Evaluation is currently ${evaluation.status}.`,
        ErrorCode.CONFLICT
      );
    }
  }

    /* -------------------------------------------------------------------------- */
  /*                           Create Evaluation                                */
  /* -------------------------------------------------------------------------- */

  /**
   * Create evaluation record.
   *
   * This only creates the placeholder evaluation.
   * AI evaluation will be generated later.
   */
  public async createEvaluation(
    data: CreateEvaluationDto
  ): Promise<EvaluationDocument> {

    const existingEvaluation =
      await this.repository.findByInterviewSession(
        data.interviewSessionId
      );

    if (existingEvaluation) {
      throw new ApiError(
        409,
        "Evaluation already exists for this interview session.",
        ErrorCode.CONFLICT
      );
    }

    const interview =
      await this.interviewRepository.findById(
        data.interviewSessionId.toString()
      );

    if (!interview) {
      throw new ApiError(
        404,
        "Interview session not found.",
        ErrorCode.NOT_FOUND
      );
    }

    return this.repository.create({
      interviewSessionId: new Types.ObjectId(
        data.interviewSessionId
      ),

      organizationId: data.organizationId
        ? new Types.ObjectId(data.organizationId)
        : undefined,

      candidateId: new Types.ObjectId(
        data.candidateId
      ),

      status: EvaluationStatus.NOT_STARTED,
    });
  }

  /* -------------------------------------------------------------------------- */
  /*                           Get Evaluation By Id                             */
  /* -------------------------------------------------------------------------- */

  /**
   * Get evaluation by id.
   */
  public async getEvaluationById(
    id: string,
    candidateId: string
  ): Promise<EvaluationDocument> {

    const evaluation =
      await this.ensureEvaluationExists(id);

    await this.ensureOwner(
      evaluation,
      candidateId
    );

    return evaluation;
  }

  /* -------------------------------------------------------------------------- */
  /*                     Get Evaluation By Interview                             */
  /* -------------------------------------------------------------------------- */

  /**
   * Get evaluation by interview session.
   */
  public async getEvaluationByInterview(
    interviewSessionId: string
  ): Promise<EvaluationDocument | null> {

    this.ensureValidObjectId(
      interviewSessionId
    );

    return this.repository.findByInterviewSession(
      interviewSessionId
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                    Get Candidate Evaluations                               */
  /* -------------------------------------------------------------------------- */

  /**
   * Get all evaluations of a candidate.
   */
  public async getCandidateEvaluations(
    candidateId: string
  ): Promise<EvaluationDocument[]> {

    this.ensureValidObjectId(candidateId);

    return this.repository.findByCandidate(
      candidateId
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                  Get Organization Evaluations                              */
  /* -------------------------------------------------------------------------- */

  /**
   * Get all evaluations of an organization.
   */
  public async getOrganizationEvaluations(
    organizationId: string
  ): Promise<EvaluationDocument[]> {

    this.ensureValidObjectId(
      organizationId
    );

    return this.repository.findByOrganization(
      organizationId
    );
  }

    /* -------------------------------------------------------------------------- */
  /*                         Generate Evaluation                                */
  /* -------------------------------------------------------------------------- */

  /**
   * Generate interview evaluation.
   *
   * Flow:
   * Evaluation
   *   ↓
   * Interview
   *   ↓
   * Conversation
   *   ↓
   * Evaluation Agent
   *   ↓
   * Save Result
   *   ↓
   * Mark Completed
   */
  public async generateEvaluation(
    evaluationId: string
  ): Promise<EvaluationDocument> {

    const evaluation =
      await this.ensureEvaluationExists(
        evaluationId
      );

    this.ensureStatus(
      evaluation,
      [
        EvaluationStatus.NOT_STARTED,
        EvaluationStatus.IN_PROGRESS,
      ]
    );

    const interview =
      await this.interviewRepository.findById(
        evaluation.interviewSessionId.toString()
      );

    if (!interview) {
      throw new ApiError(
        404,
        "Interview session not found.",
        ErrorCode.NOT_FOUND
      );
    }

    const conversation =
      await this.conversationRepository.findBySession(
        interview._id.toString()
      );

    if (
      !conversation ||
      conversation.length === 0
    ) {
      throw new ApiError(
        400,
        "Interview conversation not found.",
        ErrorCode.BAD_REQUEST
      );
    }

    await this.repository.startEvaluation(
      evaluation._id.toString()
    );

    const result =
      await this.evaluationAgent.evaluate(
        interview,
        conversation
      );

    await this.repository.saveResult(
      evaluation._id.toString(),
      result
    );

    const updatedEvaluation =
      await this.repository.completeEvaluation(
        evaluation._id.toString()
      );

    if (!updatedEvaluation) {
      throw new ApiError(
        500,
        "Failed to complete evaluation.",
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }

    return updatedEvaluation;
  }

    /* -------------------------------------------------------------------------- */
  /*                           Update Evaluation                                */
  /* -------------------------------------------------------------------------- */

  /**
   * Update evaluation manually.
   */
  public async updateEvaluation(
    id: string,
    data: UpdateEvaluationDto
  ): Promise<EvaluationDocument | null> {

    const evaluation =
      await this.ensureEvaluationExists(id);

    this.ensureStatus(
      evaluation,
      [
        EvaluationStatus.NOT_STARTED,
        EvaluationStatus.IN_PROGRESS,
        EvaluationStatus.COMPLETED,
      ]
    );

    return this.repository.update(
      id,
      data
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                          Publish Evaluation                                */
  /* -------------------------------------------------------------------------- */

  /**
   * Publish completed evaluation.
   */
  public async publishEvaluation(
    id: string
  ): Promise<EvaluationDocument | null> {

    const evaluation =
      await this.ensureEvaluationExists(id);

    this.ensureStatus(
      evaluation,
      [
        EvaluationStatus.COMPLETED,
      ]
    );

    return this.repository.publishEvaluation(
      id
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                           Reset Evaluation                                 */
  /* -------------------------------------------------------------------------- */

  /**
   * Reset evaluation.
   *
   * Useful for regenerating AI evaluation.
   */
  public async resetEvaluation(
    id: string
  ): Promise<EvaluationDocument | null> {

    const evaluation =
      await this.ensureEvaluationExists(id);

    return this.repository.resetEvaluation(
      id
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                           Delete Evaluation                                */
  /* -------------------------------------------------------------------------- */

  /**
   * Delete evaluation.
   */
  public async deleteEvaluation(
    id: string
  ): Promise<void> {

    await this.ensureEvaluationExists(id);

    await this.repository.delete(id);
  }

  /* -------------------------------------------------------------------------- */
  /*                         Candidate Statistics                               */
  /* -------------------------------------------------------------------------- */

  /**
   * Get candidate evaluation statistics.
   */
  public async getCandidateStatistics(
    candidateId: string
  ) {

    this.ensureValidObjectId(
      candidateId
    );

    return this.repository.getCandidateStatistics(
      candidateId
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                       Organization Statistics                              */
  /* -------------------------------------------------------------------------- */

  /**
   * Get organization evaluation statistics.
   */
  public async getOrganizationStatistics(
    organizationId: string
  ) {

    this.ensureValidObjectId(
      organizationId
    );

    return this.repository.getOrganizationStatistics(
      organizationId
    );
  }
}  