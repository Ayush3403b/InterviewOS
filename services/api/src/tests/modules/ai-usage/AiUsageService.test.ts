import { describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";

import AiUsageService from "../../../modules/ai-usage/services/AiUsageService";
import { ApiError } from "../../../shared/errors/ApiError";

function makeFakeRepository() {
  return {
    record: vi.fn(),
    findByInterviewSession: vi.fn(),
    summarize: vi.fn(),
  };
}

describe("AiUsageService", () => {

  it("converts string ids to ObjectId before persisting", async () => {

    const repository = makeFakeRepository();
    repository.record.mockResolvedValue({});

    const service = new AiUsageService(repository as never);
    const sessionId = new Types.ObjectId().toString();
    const userId = new Types.ObjectId().toString();

    await service.record({
      provider: "claude",
      modelName: "claude-sonnet-4-6",
      promptId: "evaluation",
      promptVersion: "v1",
      latencyMs: 100,
      success: true,
      interviewSessionId: sessionId,
      userId,
    });

    expect(repository.record).toHaveBeenCalledWith(
      expect.objectContaining({
        interviewSessionId: expect.any(Types.ObjectId),
        userId: expect.any(Types.ObjectId),
      })
    );

  });

  it("swallows repository errors instead of throwing - it must never break the AI call it's recording", async () => {

    const repository = makeFakeRepository();
    repository.record.mockRejectedValue(new Error("db is down"));

    const service = new AiUsageService(repository as never);

    await expect(
      service.record({
        provider: "claude",
        modelName: "claude-sonnet-4-6",
        promptId: "evaluation",
        promptVersion: "v1",
        latencyMs: 100,
        success: true,
      })
    ).resolves.toBeUndefined();

  });

  it("rejects an invalid session id when reading usage for a session", async () => {

    const repository = makeFakeRepository();
    const service = new AiUsageService(repository as never);

    await expect(
      service.getUsageForSession("not-an-object-id")
    ).rejects.toThrow(ApiError);

  });

  it("maps aggregate rows into byProvider/byPrompt records, defaulting totals when empty", async () => {

    const repository = makeFakeRepository();
    repository.summarize.mockResolvedValue({
      totals: undefined,
      byProvider: [
        { _id: "claude", calls: 3, tokensUsed: 900, estimatedCostUsd: 0.005 },
      ],
      byPrompt: [
        { _id: "question", calls: 3, tokensUsed: 900, estimatedCostUsd: 0.005 },
      ],
    });

    const service = new AiUsageService(repository as never);

    const summary = await service.getUsageSummary({});

    expect(summary.totalCalls).toBe(0);
    expect(summary.byProvider.claude).toEqual({
      calls: 3,
      tokensUsed: 900,
      estimatedCostUsd: 0.005,
    });
    expect(summary.byPrompt.question.calls).toBe(3);

  });

});
