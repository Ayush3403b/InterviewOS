import { Types } from "mongoose";

import { BaseService } from "../../../shared/services/BaseService";
import { ApiError } from "../../../shared/errors/ApiError";
import { ErrorCode } from "../../../shared/errors/ErrorCode";
import { logger } from "../../../shared/logger/logger";

import {
  extractResumeText,
  SUPPORTED_RESUME_MIME_TYPES,
} from "../../../shared/files/extractResumeText";

import { ResumeRepository } from "../repositories/ResumeRepository";
import { ResumeDocument, ResumeStatus } from "../types/resume.types";

import { IResumeAgent } from "../../../agents/resume/IResumeAgent";
import { deriveResumeInsights } from "../../../agents/resume/analysis/deriveResumeInsights";
import { compareResumes, ResumeComparison } from "./ResumeComparator";
import { SocialSyncService } from "./SocialSyncService";
import InterviewContextService from "../../interview-context/services/InterviewContextService";
import { GitHubImportDto, LinkedInImportDto, UpdateResumeDto, GitHubRepositoryItemDto } from "@interviewos/types";

export interface UploadedResumeFile {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
}

const MIN_RESUME_TEXT_LENGTH = 50;

export default class ResumeService extends BaseService<ResumeRepository> {
  constructor(
    repository: ResumeRepository,
    private readonly resumeAgent: IResumeAgent,
    private readonly interviewContextService: InterviewContextService,
    private readonly socialSyncService: SocialSyncService = new SocialSyncService()
  ) {
    super(repository);
  }

  private ensureValidObjectId(id: string, label: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(400, `Invalid ${label}.`, ErrorCode.BAD_REQUEST);
    }
  }

  /**
   * Extracts text, runs it through the Resume Agent, and persists the
   * result. If `interviewSessionId` is provided, the resulting summary
   * is also written into that interview's context (the same
   * Resume -> Conversation -> ... -> Next Question memory chain the
   * Question Agent already reads from) so the very next question can
   * be resume-aware.
   */
  async uploadAndAnalyze(
    userId: string,
    file: UploadedResumeFile,
    interviewSessionId?: string
  ): Promise<ResumeDocument> {
    this.ensureValidObjectId(userId, "user id");

    if (
      !SUPPORTED_RESUME_MIME_TYPES.includes(
        file.mimeType as (typeof SUPPORTED_RESUME_MIME_TYPES)[number]
      )
    ) {
      throw new ApiError(
        415,
        `Unsupported resume file type "${file.mimeType}". Upload a PDF or DOCX file.`,
        ErrorCode.BAD_REQUEST
      );
    }

    if (interviewSessionId) {
      this.ensureValidObjectId(interviewSessionId, "interview session id");
    }

    const rawText = await extractResumeText(file.buffer, file.mimeType);

    if (rawText.length < MIN_RESUME_TEXT_LENGTH) {
      throw new ApiError(
        422,
        "This resume appears to be empty or unreadable. Try a different file.",
        ErrorCode.BAD_REQUEST
      );
    }

    const created = await this.repository.create({
      userId: new Types.ObjectId(userId),
      fileName: file.originalName,
      mimeType: file.mimeType,
      rawText,
      status: ResumeStatus.PROCESSING,
      extractedSkills: [],
      suggestions: [],
    });

    try {
      const analysis = await this.resumeAgent.analyze(rawText);

      // Deterministic, rule-based layer on top of whichever agent ran
      // (LLM or Mock) - see deriveResumeInsights.ts.
      const insights = deriveResumeInsights(analysis);

      const updated = await this.repository.markParsed(created.id, {
        ...analysis,
        ...insights,
      });

      if (!updated) {
        throw new ApiError(
          500,
          "Failed to store the resume analysis.",
          ErrorCode.INTERNAL_SERVER_ERROR
        );
      }

      if (interviewSessionId) {
        await this.interviewContextService.getOrCreate(interviewSessionId);
        await this.interviewContextService.setResumeSummary(
          interviewSessionId,
          analysis.summary
        );
      }

      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      logger.error(`Resume analysis failed for resume ${created.id}`, error);

      await this.repository.markFailed(created.id, message);

      throw new ApiError(
        502,
        "Resume analysis failed. You can try uploading again.",
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getLatestForUser(userId: string): Promise<ResumeDocument | null> {
    this.ensureValidObjectId(userId, "user id");

    return this.repository.findLatestByUser(new Types.ObjectId(userId));
  }

  async getById(id: string, userId: string): Promise<ResumeDocument> {
    this.ensureValidObjectId(id, "resume id");

    const resume = await this.repository.findById(id);

    if (!resume) {
      throw new ApiError(404, "Resume not found.", ErrorCode.NOT_FOUND);
    }

    if (resume.userId.toString() !== userId) {
      throw new ApiError(
        403,
        "You don't have access to this resume.",
        ErrorCode.FORBIDDEN
      );
    }

    return resume;
  }

  /**
   * Full version history for a user. Every upload already creates a
   * new document rather than overwriting the previous one (see
   * `uploadAndAnalyze`), so this is a straightforward chronological
   * list - no separate "versioning" data model was needed.
   */
  async listVersions(userId: string, page = 1, limit = 20) {
    this.ensureValidObjectId(userId, "user id");

    return this.repository.findAllByUser(
      new Types.ObjectId(userId),
      page,
      limit
    );
  }

  /**
   * Diffs two of a user's resume versions - both must belong to the
   * requesting user (checked via `getById`, which already enforces
   * this) and must have finished parsing, or there's nothing to
   * meaningfully compare.
   */
  async compareVersions(
    userId: string,
    fromId: string,
    toId: string
  ): Promise<ResumeComparison> {
    if (fromId === toId) {
      throw new ApiError(
        400,
        "Choose two different resume versions to compare.",
        ErrorCode.BAD_REQUEST
      );
    }

    const [from, to] = await Promise.all([
      this.getById(fromId, userId),
      this.getById(toId, userId),
    ]);

    for (const [label, resume] of [
      ["from", from],
      ["to", to],
    ] as const) {
      if (resume.status !== ResumeStatus.PARSED) {
        throw new ApiError(
          409,
          `The "${label}" resume hasn't finished parsing yet (status: ${resume.status}).`,
          ErrorCode.CONFLICT
        );
      }
    }

    return compareResumes(from, to);
  }

  /**
   * Updates fields of an existing parsed resume directly in MongoDB.
   */
  async updateResume(
    userId: string,
    resumeId: string,
    updates: UpdateResumeDto
  ): Promise<ResumeDocument> {
    const resume = await this.getById(resumeId, userId);

    const updatePayload: Partial<ResumeDocument> = {};
    if (typeof updates.summary === "string") updatePayload.summary = updates.summary;
    if (Array.isArray(updates.extractedSkills)) updatePayload.extractedSkills = updates.extractedSkills;
    if (Array.isArray(updates.experience)) updatePayload.experience = updates.experience;
    if (Array.isArray(updates.education)) updatePayload.education = updates.education;
    if (Array.isArray(updates.projects)) updatePayload.projects = updates.projects;
    if (Array.isArray(updates.certifications)) updatePayload.certifications = updates.certifications;

    const updated = await this.repository.updateFields(resume.id, updatePayload);
    if (!updated) {
      throw new ApiError(500, "Failed to update resume in database.", ErrorCode.INTERNAL_SERVER_ERROR);
    }
    return updated;
  }

  /**
   * Imports candidate GitHub profile/repos and stores them as a parsed resume in MongoDB.
   */
  async importGitHubProfile(
    userId: string,
    dto: GitHubImportDto
  ): Promise<ResumeDocument> {
    this.ensureValidObjectId(userId, "user id");
    const profile = await this.socialSyncService.syncGitHubProfile(
      dto.username,
      dto.githubToken,
      dto.maxRepos
    );

    const rawText = `GitHub Profile: ${profile.username}\nName: ${profile.profileName}\nBio: ${profile.bio || ""}\nSkills: ${profile.extractedSkills.join(", ")}\nRepositories:\n${(profile.repositories || []).map((r: { name: string; language: string; description: string; stars: number }) => `- ${r.name} (${r.language}): ${r.description} [${r.stars} stars]`).join("\n")}`;

    const resume = await this.repository.create({
      userId: new Types.ObjectId(userId),
      fileName: `github-${profile.username}.json`,
      mimeType: "application/json",
      rawText,
      status: ResumeStatus.PARSED,
      summary: profile.bio || `GitHub developer profile for ${profile.profileName}`,
      extractedSkills: profile.extractedSkills,
      experience: profile.experience || [],
      education: [],
      projects: (profile.repositories || []).map((r: { name: string; description: string; topics: string[]; language: string }) => ({
        name: r.name,
        description: r.description,
        technologies: r.topics.length > 0 ? r.topics : [r.language],
      })),
      certifications: [],
      suggestions: [
        "Include production project metrics to complement GitHub open source repositories.",
        "Add formal work experience and education details.",
      ],
      atsScore: Math.min(88, 65 + profile.extractedSkills.length * 2),
    });

    return resume;
  }

  /**
   * Imports candidate LinkedIn profile data and stores it as a parsed resume in MongoDB.
   */
  async importLinkedInProfile(
    userId: string,
    dto: LinkedInImportDto
  ): Promise<ResumeDocument> {
    this.ensureValidObjectId(userId, "user id");
    const profile = await this.socialSyncService.syncLinkedInProfile(dto);

    const rawText = `LinkedIn Profile: ${profile.profileName}\nBio: ${profile.bio || ""}\nSkills: ${profile.extractedSkills.join(", ")}\nExperience:\n${(profile.experience || []).map((e: { title: string; company: string; duration: string }) => `- ${e.title} at ${e.company} (${e.duration})`).join("\n")}`;

    const resume = await this.repository.create({
      userId: new Types.ObjectId(userId),
      fileName: `linkedin-${profile.profileName.toLowerCase().replace(/[^a-z0-9]/g, "-")}.json`,
      mimeType: "application/json",
      rawText,
      status: ResumeStatus.PARSED,
      summary: profile.bio || `LinkedIn candidate profile for ${profile.profileName}`,
      extractedSkills: profile.extractedSkills,
      experience: profile.experience || [],
      education: profile.education || [],
      projects: [],
      certifications: [],
      suggestions: [
        "Quantify project outcomes with key performance indicators and revenue metrics.",
        "Add direct GitHub or project demo links to strengthen credibility.",
      ],
      atsScore: Math.min(92, 70 + profile.extractedSkills.length * 2),
    });

    return resume;
  }

  /**
   * Fetches public GitHub repositories for repository selection during resume generation.
   */
  async getGitHubRepositories(
    username: string,
    token?: string,
    maxRepos = 15
  ): Promise<GitHubRepositoryItemDto[]> {
    return this.socialSyncService.fetchUserRepositories(username, token, maxRepos);
  }
}
