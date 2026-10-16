import { describe, it, expect, vi, beforeEach } from "vitest";
import { Types } from "mongoose";

vi.mock("../../../shared/files/extractResumeText", () => ({
  extractResumeText: vi.fn(),
  SUPPORTED_RESUME_MIME_TYPES: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
}));

import ResumeService from "../../../modules/resume/services/ResumeService";
import { ResumeRepository } from "../../../modules/resume/repositories/ResumeRepository";
import { IResumeAgent } from "../../../agents/resume/IResumeAgent";
import InterviewContextService from "../../../modules/interview-context/services/InterviewContextService";
import { ResumeStatus } from "../../../modules/resume/types/resume.types";

describe("ResumeService - Updates and Social Import", () => {
  let resumeService: ResumeService;
  let mockRepo: any;
  let mockAgent: IResumeAgent;
  let mockContextService: any;

  const validUserId = new Types.ObjectId().toString();
  const validResumeId = new Types.ObjectId().toString();

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn(),
      updateFields: vi.fn(),
      create: vi.fn(),
      findLatestByUser: vi.fn(),
      findAllByUser: vi.fn(),
    };

    mockAgent = {
      analyze: vi.fn(),
    };

    mockContextService = {
      getOrCreate: vi.fn(),
      setResumeSummary: vi.fn(),
    };

    resumeService = new ResumeService(
      mockRepo as unknown as ResumeRepository,
      mockAgent,
      mockContextService as unknown as InterviewContextService
    );
  });

  it("updates resume fields in MongoDB successfully", async () => {
    mockRepo.findById.mockResolvedValue({
      id: validResumeId,
      userId: { toString: () => validUserId },
      status: ResumeStatus.PARSED,
      summary: "Old summary",
    });

    mockRepo.updateFields.mockResolvedValue({
      id: validResumeId,
      userId: validUserId,
      status: ResumeStatus.PARSED,
      summary: "Updated senior summary",
      extractedSkills: ["React", "TypeScript", "GraphQL"],
    });

    const result = await resumeService.updateResume(validUserId, validResumeId, {
      summary: "Updated senior summary",
      extractedSkills: ["React", "TypeScript", "GraphQL"],
    });

    expect(mockRepo.updateFields).toHaveBeenCalledWith(validResumeId, {
      summary: "Updated senior summary",
      extractedSkills: ["React", "TypeScript", "GraphQL"],
    });
    expect(result.summary).toBe("Updated senior summary");
  });

  it("prevents updating resume belonging to another user", async () => {
    const otherUserId = new Types.ObjectId().toString();
    mockRepo.findById.mockResolvedValue({
      id: validResumeId,
      userId: { toString: () => otherUserId },
    });

    await expect(
      resumeService.updateResume(validUserId, validResumeId, { summary: "Hacked" })
    ).rejects.toThrow("You don't have access to this resume.");
  });

  it("imports candidate GitHub profile and stores parsed resume in MongoDB", async () => {
    mockRepo.create.mockImplementation((data: any) => ({
      id: validResumeId,
      ...data,
    }));

    const result = await resumeService.importGitHubProfile(validUserId, {
      username: "torvalds",
    });

    expect(mockRepo.create).toHaveBeenCalled();
    expect(result.status).toBe(ResumeStatus.PARSED);
    expect(result.fileName).toContain("github-torvalds");
    expect(result.extractedSkills.length).toBeGreaterThan(0);
  });

  it("imports candidate LinkedIn profile and stores parsed resume in MongoDB", async () => {
    mockRepo.create.mockImplementation((data: any) => ({
      id: validResumeId,
      ...data,
    }));

    const rawText = `Sarah Connor\nLead DevOps Engineer with expertise in Kubernetes, Docker, and CI/CD`;
    const result = await resumeService.importLinkedInProfile(validUserId, {
      rawText,
    });

    expect(mockRepo.create).toHaveBeenCalled();
    expect(result.status).toBe(ResumeStatus.PARSED);
    expect(result.fileName).toContain("linkedin-sarah-connor");
  });
});
