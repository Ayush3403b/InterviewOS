import { FilterQuery, Types } from "mongoose";

import { BaseRepository } from "../../../database/BaseRepository";

import { EvaluationModel } from "../models/EvaluationModel";

import {
  EvaluationDocument,
  EvaluationStatus,
} from "../types/evaluation.types";

export class EvaluationRepository extends BaseRepository<EvaluationDocument> {
  constructor() {
    super(EvaluationModel);
  }

  /* -------------------------------------------------------------------------- */
  /*                                   Queries                                  */
  /* -------------------------------------------------------------------------- */

  /**
   * Create Evaluation
   */
  async createEvaluation(
    data: Partial<EvaluationDocument>
  ) {
    return this.create(data);
  }

  /**
   * Find Evaluation by ID
   */
  async findById(id: string) {
    return super.findById(id);
  }

  /**
   * Find Evaluation by Interview Session
   */
  async findByInterviewSession(
    interviewSessionId: string
  ) {
    return this.model.findOne({
      interviewSessionId: new Types.ObjectId(
        interviewSessionId
      ),
    });
  }

  /**
   * Find Evaluations by Candidate
   */
  async findByCandidate(
    candidateId: string,
    page = 1,
    limit = 10
  ) {
    const skip = (page - 1) * limit;

    return this.model
      .find({
        candidateId: new Types.ObjectId(candidateId),
      })
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit);
  }

  /**
   * Find Evaluations by Organization
   */
  async findByOrganization(
    organizationId: string,
    page = 1,
    limit = 10
  ) {
    const skip = (page - 1) * limit;

    return this.model
      .find({
        organizationId: new Types.ObjectId(
          organizationId
        ),
      })
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit);
  }

  /**
   * Generic Filter
   */
  async findWithFilter(
    filter: FilterQuery<EvaluationDocument>
  ) {
    return this.model.find(filter);
  }

  /* -------------------------------------------------------------------------- */
  /*                           Evaluation Lifecycle                             */
  /* -------------------------------------------------------------------------- */

  /**
   * Mark Evaluation In Progress
   */
  async startEvaluation(id: string) {
    return this.model.findByIdAndUpdate(
      id,
      {
        status: EvaluationStatus.IN_PROGRESS,
      },
      {
        new: true,
      }
    );
  }

  /**
   * Complete Evaluation
   */
  async completeEvaluation(
    id: string,
    data: Partial<EvaluationDocument>
  ) {
    return this.model.findByIdAndUpdate(
      id,
      {
        ...data,
        status: EvaluationStatus.COMPLETED,
      },
      {
        new: true,
      }
    );
  }

  /**
   * Publish Evaluation
   */
  async publishEvaluation(id: string) {
    return this.model.findByIdAndUpdate(
      id,
      {
        status: EvaluationStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      {
        new: true,
      }
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                                 Dashboard                                  */
  /* -------------------------------------------------------------------------- */

  /**
   * Count Candidate Evaluations
   */
  async countByCandidate(
    candidateId: string
  ) {
    return this.model.countDocuments({
      candidateId: new Types.ObjectId(candidateId),
    });
  }

  /**
   * Evaluation Statistics
   */
  async getStatistics() {
    return this.model.aggregate([
      {
        $group: {
          _id: null,

          totalEvaluations: {
            $sum: 1,
          },

          averageScore: {
            $avg: "$overallScore",
          },
        },
      },
    ]);
  }
}

export default EvaluationRepository;