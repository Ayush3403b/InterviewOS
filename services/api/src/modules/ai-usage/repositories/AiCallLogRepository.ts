import { Types } from "mongoose";

import { BaseRepository } from "../../../database/BaseRepository";
import { AiCallLogModel } from "../models/AiCallLogModel";
import { AiCallLogDocument, AiCallLogInput } from "../types/ai-usage.types";

export class AiCallLogRepository extends BaseRepository<AiCallLogDocument> {
  constructor() {
    super(AiCallLogModel);
  }

  async record(entry: AiCallLogInput) {
    return this.model.create(entry);
  }

  async findByInterviewSession(interviewSessionId: string | Types.ObjectId) {
    return this.model
      .find({ interviewSessionId })
      .sort({ createdAt: -1 });
  }

  /**
   * Aggregated usage summary, optionally scoped to a single interview
   * session, user, or starting from a specific date.
   */
  async summarize(filter: {
    interviewSessionId?: string;
    userId?: string;
    fromDate?: Date;
  }) {
    const match: Record<string, unknown> = {};

    if (filter.interviewSessionId) {
      match.interviewSessionId = new Types.ObjectId(
        filter.interviewSessionId
      );
    }

    if (filter.userId) {
      match.userId = new Types.ObjectId(filter.userId);
    }

    if (filter.fromDate) {
      match.createdAt = { $gte: filter.fromDate };
    }

    const [totals] = await this.model.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalCalls: { $sum: 1 },
          successfulCalls: { $sum: { $cond: ["$success", 1, 0] } },
          failedCalls: { $sum: { $cond: ["$success", 0, 1] } },
          totalTokensUsed: { $sum: { $ifNull: ["$tokensUsed", 0] } },
          totalEstimatedCostUsd: {
            $sum: { $ifNull: ["$estimatedCostUsd", 0] },
          },
        },
      },
    ]);

    const byProvider = await this.model.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$provider",
          calls: { $sum: 1 },
          tokensUsed: { $sum: { $ifNull: ["$tokensUsed", 0] } },
          estimatedCostUsd: { $sum: { $ifNull: ["$estimatedCostUsd", 0] } },
        },
      },
    ]);

    const byPrompt = await this.model.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$promptId",
          calls: { $sum: 1 },
          tokensUsed: { $sum: { $ifNull: ["$tokensUsed", 0] } },
          estimatedCostUsd: { $sum: { $ifNull: ["$estimatedCostUsd", 0] } },
        },
      },
    ]);

    return { totals, byProvider, byPrompt };
  }
}
