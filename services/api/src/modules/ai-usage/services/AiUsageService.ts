import { Types } from "mongoose";

import { BaseService } from "../../../shared/services/BaseService";
import { ApiError } from "../../../shared/errors/ApiError";
import { ErrorCode } from "../../../shared/errors/ErrorCode";

import { AiCallLogRepository } from "../repositories/AiCallLogRepository";
import { AiUsageSummary, RecordAiCallInput } from "../types/ai-usage.types";

export default class AiUsageService extends BaseService<AiCallLogRepository> {
  constructor(repository: AiCallLogRepository) {
    super(repository);
  }

  /**
   * Fire-and-forget by design - a failure to log usage should never
   * break the actual AI call it's recording. Callers (PersistingLLMClient)
   * should not await this in a way that can fail their main flow.
   */
  async record(entry: RecordAiCallInput): Promise<void> {
    try {
      await this.repository.record({
        ...entry,
        interviewSessionId: entry.interviewSessionId
          ? new Types.ObjectId(entry.interviewSessionId)
          : undefined,
        userId: entry.userId ? new Types.ObjectId(entry.userId) : undefined,
      });
    } catch {
      // Deliberately swallowed - see docstring above.
    }
  }

  async getUsageForSession(interviewSessionId: string) {
    if (!Types.ObjectId.isValid(interviewSessionId)) {
      throw new ApiError(
        400,
        "Invalid interview session id.",
        ErrorCode.BAD_REQUEST
      );
    }

    return this.repository.findByInterviewSession(interviewSessionId);
  }

  async getUsageSummary(filter: {
    interviewSessionId?: string;
    userId?: string;
  }): Promise<AiUsageSummary> {
    const { totals, byProvider, byPrompt } =
      await this.repository.summarize(filter);

    const toRecord = (
      rows: { _id: string; calls: number; tokensUsed: number; estimatedCostUsd: number }[]
    ) =>
      rows.reduce<AiUsageSummary["byProvider"]>((acc, row) => {
        acc[row._id ?? "unknown"] = {
          calls: row.calls,
          tokensUsed: row.tokensUsed,
          estimatedCostUsd: row.estimatedCostUsd,
        };
        return acc;
      }, {});

    return {
      totalCalls: totals?.totalCalls ?? 0,
      successfulCalls: totals?.successfulCalls ?? 0,
      failedCalls: totals?.failedCalls ?? 0,
      totalTokensUsed: totals?.totalTokensUsed ?? 0,
      totalEstimatedCostUsd: totals?.totalEstimatedCostUsd ?? 0,
      byProvider: toRecord(byProvider),
      byPrompt: toRecord(byPrompt),
    };
  }
}
