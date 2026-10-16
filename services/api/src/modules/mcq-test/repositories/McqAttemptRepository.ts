import { Types } from "mongoose";

import { BaseRepository } from "../../../database/BaseRepository";

import { McqAttemptModel } from "../models/McqAttemptModel";

import {
  McqAttemptDocument,
  McqAttemptResult,
  McqAttemptStatus,
  McqSubmitReason,
} from "../types/mcq-test.types";

export interface AttemptCounts {
  total: number;
  submitted: number;
}

export class McqAttemptRepository extends BaseRepository<McqAttemptDocument> {
  constructor() {
    super(McqAttemptModel);
  }

  /* -------------------------------------------------------------------------- */
  /*                                   Queries                                   */
  /* -------------------------------------------------------------------------- */

  async findByTestAndCandidate(
    testId: string | Types.ObjectId,
    candidateId: string | Types.ObjectId
  ) {
    return this.model.findOne({ testId, candidateId });
  }

  /** Results listing - newest first, with the candidate's name/email. */
  async findByTest(testId: string | Types.ObjectId) {
    return this.model
      .find({ testId })
      .populate("candidateId", "firstName lastName email avatar")
      .sort({ startedAt: -1 });
  }

  async findByCandidate(candidateId: string | Types.ObjectId) {
    return this.model.find({ candidateId }).sort({ startedAt: -1 });
  }

  async findByIdWithCandidate(id: string | Types.ObjectId) {
    return this.model
      .findById(id)
      .populate("candidateId", "firstName lastName email avatar");
  }

  async countByTest(testId: string | Types.ObjectId): Promise<number> {
    return this.model.countDocuments({ testId });
  }

  /** testId -> attempt counts, for the author's test list. */
  async countByTests(
    testIds: Types.ObjectId[]
  ): Promise<Map<string, AttemptCounts>> {
    const counts = new Map<string, AttemptCounts>();

    if (!testIds.length) {
      return counts;
    }

    const rows: { _id: Types.ObjectId; total: number; submitted: number }[] =
      await this.model.aggregate([
        { $match: { testId: { $in: testIds } } },
        {
          $group: {
            _id: "$testId",
            total: { $sum: 1 },
            submitted: {
              $sum: {
                $cond: [{ $eq: ["$status", McqAttemptStatus.SUBMITTED] }, 1, 0],
              },
            },
          },
        },
      ]);

    for (const row of rows) {
      counts.set(row._id.toString(), {
        total: row.total,
        submitted: row.submitted,
      });
    }

    return counts;
  }

  /* -------------------------------------------------------------------------- */
  /*                                  Mutations                                  */
  /* -------------------------------------------------------------------------- */

  /**
   * Records (or clears, with null) one answer - only while the attempt
   * is in progress and its deadline is no earlier than
   * `deadlineNoEarlierThan` (the caller passes now minus the grace
   * period). Returns whether the write happened.
   */
  async setAnswer(
    id: string | Types.ObjectId,
    questionId: string,
    selectedOptionIndex: number | null,
    deadlineNoEarlierThan: Date
  ): Promise<boolean> {
    const update =
      selectedOptionIndex === null
        ? { $unset: { [`answers.${questionId}`]: "" } }
        : { $set: { [`answers.${questionId}`]: selectedOptionIndex } };

    const { matchedCount } = await this.model.updateOne(
      {
        _id: id,
        status: McqAttemptStatus.IN_PROGRESS,
        deadlineAt: { $gte: deadlineNoEarlierThan },
      },
      update
    );

    return matchedCount > 0;
  }

  /**
   * Phase one of submitting: flips IN_PROGRESS -> SUBMITTED atomically,
   * which also stops any further setAnswer writes. Null if it was
   * already submitted. The returned doc's answers are therefore final.
   */
  async markSubmitted(
    id: string | Types.ObjectId,
    reason: McqSubmitReason,
    submittedAt: Date
  ) {
    return this.model.findOneAndUpdate(
      { _id: id, status: McqAttemptStatus.IN_PROGRESS },
      {
        $set: {
          status: McqAttemptStatus.SUBMITTED,
          submittedAt,
          submitReason: reason,
        },
      },
      { new: true }
    );
  }

  /** Phase two: store the score computed from markSubmitted's result. */
  async setResult(id: string | Types.ObjectId, result: McqAttemptResult) {
    return this.model.findByIdAndUpdate(
      id,
      { $set: { result } },
      { new: true }
    );
  }
}
