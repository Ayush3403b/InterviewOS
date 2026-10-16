import { describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";

vi.mock("../../../shared/files/extractResumeText", () => ({
  extractResumeText: vi.fn(),
  SUPPORTED_RESUME_MIME_TYPES: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
}));

import ResumeService from "../../../modules/resume/services/ResumeService";
import { ResumeStatus } from "../../../modules/resume/types/resume.types";
import { extractResumeText } from "../../../shared/files/extractResumeText";
import { ApiError } from "../../../shared/errors/ApiError";

function makeFakeRepository() {
  return {
    create: vi.fn(),
    markParsed: vi.fn(),
    markFailed: vi.fn(),
    findLatestByUser: vi.fn(),
    findById: vi.fn(),
  };
}

function makeFakeResumeAgent(
  behavior: "succeed" | "fail" = "succeed"
) {
  return {
    analyze: vi.fn().mockImplementation(() =>
      behavior === "succeed"
        ? Promise.resolve({
            summary: "Great candidate summary",
            extractedSkills: ["React"],
            atsScore: 80,
            suggestions: ["Add metrics"],
          })
        : Promise.reject(new Error("agent exploded"))
    ),
  };
}

function makeFakeInterviewContextService() {
  return {
    getOrCreate: vi.fn().mockResolvedValue({}),
    setResumeSummary: vi.fn().mockResolvedValue({}),
  };
}

const validUserId = new Types.ObjectId().toString();

const file = {
  buffer: Buffer.from("fake"),
  mimeType: "application/pdf",
  originalName: "resume.pdf",
};

describe("ResumeService.uploadAndAnalyze", () => {

  it("rejects an unsupported mime type before touching the repository", async () => {

    const repository = makeFakeRepository();
    const service = new ResumeService(
      repository as never,
      makeFakeResumeAgent() as never,
      makeFakeInterviewContextService() as never
    );

    await expect(
      service.uploadAndAnalyze(validUserId, { ...file, mimeType: "image/png" })
    ).rejects.toThrow(ApiError);

    expect(repository.create).not.toHaveBeenCalled();

  });

  it("rejects resume text that's too short to be a real resume", async () => {

    vi.mocked(extractResumeText).mockResolvedValue("too short");

    const repository = makeFakeRepository();
    const service = new ResumeService(
      repository as never,
      makeFakeResumeAgent() as never,
      makeFakeInterviewContextService() as never
    );

    await expect(
      service.uploadAndAnalyze(validUserId, file)
    ).rejects.toThrow(ApiError);

    expect(repository.create).not.toHaveBeenCalled();

  });

  it("creates, analyzes, and marks the resume parsed on success", async () => {

    vi.mocked(extractResumeText).mockResolvedValue(
      "A".repeat(100) + " long enough resume text with real content"
    );

    const repository = makeFakeRepository();
    repository.create.mockResolvedValue({ id: "resume-1" });
    repository.markParsed.mockResolvedValue({
      id: "resume-1",
      status: ResumeStatus.PARSED,
    });

    const service = new ResumeService(
      repository as never,
      makeFakeResumeAgent("succeed") as never,
      makeFakeInterviewContextService() as never
    );

    const result = await service.uploadAndAnalyze(validUserId, file);

    expect(repository.markParsed).toHaveBeenCalledWith(
      "resume-1",
      expect.objectContaining({ atsScore: 80 })
    );
    expect(result.status).toBe(ResumeStatus.PARSED);

  });

  it("feeds the summary into interview context when a session id is given", async () => {

    vi.mocked(extractResumeText).mockResolvedValue(
      "A".repeat(100) + " long enough resume text with real content"
    );

    const repository = makeFakeRepository();
    repository.create.mockResolvedValue({ id: "resume-1" });
    repository.markParsed.mockResolvedValue({ id: "resume-1" });

    const contextService = makeFakeInterviewContextService();
    const sessionId = new Types.ObjectId().toString();

    const service = new ResumeService(
      repository as never,
      makeFakeResumeAgent("succeed") as never,
      contextService as never
    );

    await service.uploadAndAnalyze(validUserId, file, sessionId);

    expect(contextService.getOrCreate).toHaveBeenCalledWith(sessionId);
    expect(contextService.setResumeSummary).toHaveBeenCalledWith(
      sessionId,
      "Great candidate summary"
    );

  });

  it("marks the resume failed and throws if the agent throws", async () => {

    vi.mocked(extractResumeText).mockResolvedValue(
      "A".repeat(100) + " long enough resume text with real content"
    );

    const repository = makeFakeRepository();
    repository.create.mockResolvedValue({ id: "resume-1" });

    const service = new ResumeService(
      repository as never,
      makeFakeResumeAgent("fail") as never,
      makeFakeInterviewContextService() as never
    );

    await expect(
      service.uploadAndAnalyze(validUserId, file)
    ).rejects.toThrow(ApiError);

    expect(repository.markFailed).toHaveBeenCalledWith(
      "resume-1",
      expect.any(String)
    );

  });

});

describe("ResumeService.getById", () => {

  it("throws NOT_FOUND when the resume doesn't exist", async () => {

    const repository = makeFakeRepository();
    repository.findById.mockResolvedValue(null);

    const service = new ResumeService(
      repository as never,
      makeFakeResumeAgent() as never,
      makeFakeInterviewContextService() as never
    );

    await expect(
      service.getById(new Types.ObjectId().toString(), validUserId)
    ).rejects.toThrow(ApiError);

  });

  it("throws FORBIDDEN when the resume belongs to someone else", async () => {

    const repository = makeFakeRepository();
    repository.findById.mockResolvedValue({
      userId: new Types.ObjectId(),
    });

    const service = new ResumeService(
      repository as never,
      makeFakeResumeAgent() as never,
      makeFakeInterviewContextService() as never
    );

    await expect(
      service.getById(new Types.ObjectId().toString(), validUserId)
    ).rejects.toThrow(ApiError);

  });

});
