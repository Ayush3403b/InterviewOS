import { FilterQuery, Types } from "mongoose";

import { BaseRepository } from "../../../database/BaseRepository";

import { EvaluationModel } from "../models/EvaluationModel";

import { CompleteEvaluationDto } from "../dtos/CompleteEvaluation.dto";

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
   * Find evaluation by interview session
   */
  async findByInterviewSession(
    interviewSessionId: string | Types.ObjectId
  ) {
    return this.model.findOne({
      interviewSessionId,
    });
  }

  /**
   * Find evaluation by candidate
   */
  async findByCandidate(
    candidateId: string | Types.ObjectId
  ) {
    return this.model
      .find({
        candidateId,
      })
      .sort({
        createdAt: -1,
      });
  }

  /**
   * Find evaluation by organization
   */
  async findByOrganization(
    organizationId: string | Types.ObjectId
  ) {
    return this.model
      .find({
        organizationId,
      })
      .sort({
        createdAt: -1,
      });
  }

  /**
   * Find evaluations by status
   */
  async findByStatus(
    status: EvaluationStatus
  ) {
    return this.model.find({
      status,
    });
  }

  /**
   * Generic filter helper
   */
  async findWithFilter(
    filter: FilterQuery<EvaluationDocument>
  ) {
    return this.model.find(filter);
  }

  /* -------------------------------------------------------------------------- */
  /*                             Lifecycle Updates                              */
  /* -------------------------------------------------------------------------- */

  /**
   * Mark evaluation as started
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
   * Save AI evaluation result
   */
  async saveResult(
    id: string,
    data: CompleteEvaluationDto
  ) {
    return this.model.findByIdAndUpdate(
      id,
      {
        ...data,
      },
      {
        new: true,
      }
    );
  }

  /**
   * Mark evaluation as completed
   */
  async completeEvaluation(
    id: string
  ) {
    return this.model.findByIdAndUpdate(
      id,
      {
        status: EvaluationStatus.COMPLETED,
      },
      {
        new: true,
      }
    );
  }

  /**
   * Publish evaluation
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

  /**
   * Reset evaluation
   */
  async resetEvaluation(id: string) {
    return this.model.findByIdAndUpdate(
      id,
      {
        status: EvaluationStatus.NOT_STARTED,

        overallScore: 0,

        skillScores: {
          technical: 0,
          communication: 0,
          problemSolving: 0,
          confidence: 0,
          leadership: 0,
          criticalThinking: 0,
        },

        strengths: [],

        weaknesses: [],

        recommendations: [],

        overallSummary: "",

        questionEvaluations: [],

        skillGaps: [],

        metadata: {},

        publishedAt: null,
      },
      {
        new: true,
      }
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                                Statistics                                  */
  /* -------------------------------------------------------------------------- */

  /**
   * Count evaluations of candidate
   */
  async countByCandidate(
    candidateId: string | Types.ObjectId
  ) {
    return this.model.countDocuments({
      candidateId,
    });
  }

  /**
   * Candidate evaluation statistics
   */
  async getCandidateStatistics(
    candidateId: string | Types.ObjectId
  ) {
    return this.model.aggregate([
      {
        $match: {
          candidateId: new Types.ObjectId(candidateId),
        },
      },
      {
        $group: {
          _id: null,

          totalEvaluations: {
            $sum: 1,
          },

          averageScore: {
            $avg: "$overallScore",
          },

          highestScore: {
            $max: "$overallScore",
          },

          lowestScore: {
            $min: "$overallScore",
          },
        },
      },
    ]);
  }

  /**
   * Organization evaluation statistics
   */
  async getOrganizationStatistics(
    organizationId: string | Types.ObjectId
  ) {
    return this.model.aggregate([
      {
        $match: {
          organizationId: new Types.ObjectId(
            organizationId
          ),
        },
      },
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