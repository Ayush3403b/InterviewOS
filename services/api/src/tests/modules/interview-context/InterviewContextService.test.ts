import { describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";

import InterviewContextService from "../../../modules/interview-context/services/InterviewContextService";
import { ApiError } from "../../../shared/errors/ApiError";

function makeFakeRepository() {
  return {
    getOrCreate: vi.fn(),
    setResumeSummary: vi.fn(),
    appendTurn: vi.fn(),
    findByInterviewSession: vi.fn(),
  };
}

describe("InterviewContextService", () => {

  it("rejects an invalid interview session id before touching the repository", async () => {

    const repository = makeFakeRepository();
    const service = new InterviewContextService(repository as never);

    await expect(service.getOrCreate("not-an-object-id")).rejects.toThrow(
      ApiError
    );

    expect(repository.getOrCreate).not.toHaveBeenCalled();

  });

  it("delegates getOrCreate to the repository with a real ObjectId", async () => {

    const repository = makeFakeRepository();
    const fakeDoc = { transcriptSummary: "" };
    repository.getOrCreate.mockResolvedValue(fakeDoc);

    const service = new InterviewContextService(repository as never);
    const id = new Types.ObjectId().toString();

    const result = await service.getOrCreate(id);

    expect(result).toBe(fakeDoc);
    expect(repository.getOrCreate).toHaveBeenCalledWith(
      expect.any(Types.ObjectId)
    );

  });

  it("throws if appendTurn's repository call returns null", async () => {

    const repository = makeFakeRepository();
    repository.appendTurn.mockResolvedValue(null);

    const service = new InterviewContextService(repository as never);
    const id = new Types.ObjectId().toString();

    await expect(
      service.appendTurn(id, {
        transcriptSummary: "s",
        newTopics: [],
        difficultyUsed: "BEGINNER",
        answerQuality: 50,
      })
    ).rejects.toThrow(ApiError);

  });

  it("returns null from getContext when no context exists yet, without throwing", async () => {

    const repository = makeFakeRepository();
    repository.findByInterviewSession.mockResolvedValue(null);

    const service = new InterviewContextService(repository as never);
    const id = new Types.ObjectId().toString();

    const result = await service.getContext(id);

    expect(result).toBeNull();

  });

});
