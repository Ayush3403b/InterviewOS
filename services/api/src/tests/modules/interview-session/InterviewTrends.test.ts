import { describe, it, expect, beforeEach, vi } from "vitest";
import { Types } from "mongoose";

import InterviewSessionService from "../../../modules/interview-session/services/InterviewSessionService";
import { InterviewSessionRepository } from "../../../modules/interview-session/repositories/InterviewSessionRepository";

describe("InterviewSessionService - Score Trends", () => {
  let repository: InterviewSessionRepository;
  let service: InterviewSessionService;

  const userId = new Types.ObjectId().toString();

  const fakeTrends = [
    {
      _id: new Types.ObjectId(),
      title: "Backend Engineer Round 1",
      type: "TECHNICAL",
      level: "INTERMEDIATE",
      score: 78,
      duration: 1200,
      createdAt: new Date("2026-08-01"),
    },
    {
      _id: new Types.ObjectId(),
      title: "Backend Engineer Round 2",
      type: "CODING",
      level: "ADVANCED",
      score: 88,
      duration: 1500,
      createdAt: new Date("2026-08-15"),
    },
  ];

  beforeEach(() => {
    repository = new InterviewSessionRepository();
    vi.spyOn(repository, "getScoreTrends").mockResolvedValue(fakeTrends as any);

    service = new InterviewSessionService(repository);
  });

  it("fetches score trends for valid user", async () => {
    const trends = await service.getScoreTrends(userId, 10);

    expect(trends).toHaveLength(2);
    expect(trends[0].score).toBe(78);
    expect(trends[1].score).toBe(88);
    expect(repository.getScoreTrends).toHaveBeenCalledWith(userId, 10);
  });

  it("rejects invalid user id format", async () => {
    await expect(service.getScoreTrends("invalid-id")).rejects.toThrow(
      "Invalid user id."
    );
  });
});
