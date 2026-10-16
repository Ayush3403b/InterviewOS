import { Document, Types } from "mongoose";

export interface AiCallLog {
  /** Which LLM provider actually served this call (claude/openai/gemini/mock). */
  provider: string;

  modelName: string;

  /** Identifies which prompt this call used, e.g. "evaluation", "question". */
  promptId: string;

  promptVersion: string;

  /** Combined input+output tokens, when the provider reports it. */
  tokensUsed?: number;

  /** Rough USD estimate from a static per-provider rate table - see costEstimate.ts. */
  estimatedCostUsd?: number;

  latencyMs: number;

  success: boolean;

  errorMessage?: string;

  interviewSessionId?: Types.ObjectId;

  userId?: Types.ObjectId;

  createdAt: Date;
}

export interface AiCallLogDocument extends AiCallLog, Document<Types.ObjectId> {}

/** Shape callers provide when recording a call - createdAt is set by Mongoose timestamps. */
export type AiCallLogInput = Omit<AiCallLog, "createdAt">;

/**
 * Same as AiCallLogInput but with plain string ids - what the
 * agents/ layer works with, since it doesn't depend on Mongoose
 * Types.ObjectId. AiUsageService converts these to ObjectId.
 */
export type RecordAiCallInput = Omit<
  AiCallLogInput,
  "interviewSessionId" | "userId"
> & {
  interviewSessionId?: string;
  userId?: string;
};

export interface AiUsageSummary {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  totalTokensUsed: number;
  totalEstimatedCostUsd: number;
  byProvider: Record<
    string,
    { calls: number; tokensUsed: number; estimatedCostUsd: number }
  >;
  byPrompt: Record<
    string,
    { calls: number; tokensUsed: number; estimatedCostUsd: number }
  >;
}
