import { FilterQuery, Types } from "mongoose";

import { BaseRepository } from "../../../database/BaseRepository";

import { InterviewSessionModel } from "../models/InterviewSessionModel";

import { env } from "../../../config/env";

import {
  InterviewSessionDocument,
  InterviewStatus,
  InterviewType,
} from "../types/interview-session.types";

export class InterviewSessionRepository extends BaseRepository<InterviewSessionDocument> {
  constructor() {
    super(InterviewSessionModel);
  }

  /* -------------------------------------------------------------------------- */
  /*                                   Queries                                  */
  /* -------------------------------------------------------------------------- */

  /**
   * Find interview by id and owner
   */
  async findByIdAndUser(
    id: string,
    userId: string | Types.ObjectId
  ) {
    return this.model.findOne({
      _id: id,
      userId,
    });
  }

  /**
   * Find active interview session.
   *
   * Deliberately excludes an IN_PROGRESS session that's gone stale
   * (no activity for longer than INTERVIEW_IN_PROGRESS_TIMEOUT_MINUTES)
   * - otherwise an abandoned session (browser crash, network loss)
   * would block the candidate from ever starting another interview.
   * The stale session itself gets formally moved to EXPIRED lazily,
   * the next time anyone fetches it - see
   * InterviewSessionService.ensureInterviewExists.
   */
  async findActiveSession(
    userId: string | Types.ObjectId
  ) {
    const staleCutoff = new Date(
      Date.now() - env.INTERVIEW_IN_PROGRESS_TIMEOUT_MINUTES * 60 * 1000
    );

    return this.model.findOne({
      userId,
      status: InterviewStatus.IN_PROGRESS,
      updatedAt: { $gte: staleCutoff },
    });
  }

  /** Auto-transition to EXPIRED - see InterviewStatus.EXPIRED's doc comment. */
  async expireSession(id: string | Types.ObjectId) {
    return this.model.findByIdAndUpdate(
      id,
      { status: InterviewStatus.EXPIRED },
      { new: true }
    );
  }

  /**
   * Find all interviews of a user
   */
  async findByUser(
    userId: string | Types.ObjectId,
    page = 1,
    limit = 10
  ) {
    const skip = (page - 1) * limit;

    return this.model
      .find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  /**
   * Count interviews of a user
   */
  async countByUser(
    userId: string | Types.ObjectId
  ) {
    return this.model.countDocuments({
      userId,
    });
  }

  /**
   * Find interviews by status
   */
  async findByStatus(
    userId: string | Types.ObjectId,
    status: InterviewStatus
  ) {
    return this.model.find({
      userId,
      status,
    });
  }

  /**
   * Find interviews by type
   */
  async findByType(
    userId: string | Types.ObjectId,
    type: InterviewType
  ) {
    return this.model.find({
      userId,
      type,
    });
  }

  /**
   * Generic search helper
   */
  async findWithFilter(
    filter: FilterQuery<InterviewSessionDocument>
  ) {
    return this.model.find(filter);
  }

  /* -------------------------------------------------------------------------- */
  /*                             Interview Lifecycle                            */
  /* -------------------------------------------------------------------------- */

  /**
   * Start interview
   */
  async startInterview(id: string) {
    return this.model.findByIdAndUpdate(
      id,
      {
        status: InterviewStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
      {
        new: true,
      }
    );
  }

  /**
   * Pause interview
   */
  async pauseInterview(id: string) {
    return this.model.findByIdAndUpdate(
      id,
      {
        status: InterviewStatus.PAUSED,
      },
      {
        new: true,
      }
    );
  }

  /**
   * Resume interview
   */
  async resumeInterview(id: string) {
    return this.model.findByIdAndUpdate(
      id,
      {
        status: InterviewStatus.IN_PROGRESS,
      },
      {
        new: true,
      }
    );
  }

  /**
   * Cancel interview
   */
  async cancelInterview(id: string) {
    return this.model.findByIdAndUpdate(
      id,
      {
        status: InterviewStatus.CANCELLED,
      },
      {
        new: true,
      }
    );
  }

  /**
   * Complete interview
   */
  async completeInterview(
    id: string,
    score: number,
    feedback: string,
    duration: number
  ) {
    return this.model.findByIdAndUpdate(
      id,
      {
        status: InterviewStatus.COMPLETED,
        score,
        feedback,
        duration,
        completedAt: new Date(),
      },
      {
        new: true,
      }
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                             Interview Progress                             */
  /* -------------------------------------------------------------------------- */

  /**
   * Increment completed turns
   */
  async incrementTurn(id: string) {
    return this.model.findByIdAndUpdate(
      id,
      {
        $inc: {
          turnCount: 1,
        },
      },
      {
        new: true,
      }
    );
  }

  /**
   * Reset interview progress
   */
  async resetProgress(id: string) {
    return this.model.findByIdAndUpdate(
      id,
      {
        turnCount: 0,
        duration: 0,
        score: 0,
        feedback: "",
        startedAt: null,
        completedAt: null,
        status: InterviewStatus.CREATED,
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
   * Recent interviews
   */
  async getRecentInterviews(
    userId: string | Types.ObjectId,
    limit = 5
  ) {
    return this.model
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  /**
   * Interview statistics
   */
  async getStatistics(
    userId: string | Types.ObjectId
  ) {
    return this.model.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
        },
      },
      {
        $group: {
          _id: null,
          totalInterviews: {
            $sum: 1,
          },
          completedInterviews: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$status",
                    InterviewStatus.COMPLETED,
                  ],
                },
                1,
                0,
              ],
            },
          },
          averageScore: {
            $avg: "$score",
          },
          totalDuration: {
            $sum: "$duration",
          },
        },
      },
    ]);
  }

  /**
   * Score progression trends across completed interviews.
   */
  async getScoreTrends(
    userId: string | Types.ObjectId,
    limit = 20
  ) {
    return this.model
      .find({
        userId: new Types.ObjectId(userId),
        status: InterviewStatus.COMPLETED,
      })
      .select("title type level score duration completedAt createdAt")
      .sort({ createdAt: 1 })
      .limit(limit);
  }
}