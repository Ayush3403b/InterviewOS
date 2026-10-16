import { Types } from "mongoose";
import { ApiError } from "../../../shared/errors/ApiError";
import { ErrorCode } from "../../../shared/errors/ErrorCode";
import {
  GrammarCheckResult,
  IResumeWriterAgent,
  JDMatchOptions,
  JDMatchResult,
  RewriteOptions,
  RewriteResult,
} from "../../../agents/resume-writer/IResumeWriterAgent";
import { buildResumePdf, ExportResumeDto } from "../../../shared/pdf/buildResumePdf";
import { ResumeRepository } from "../../resume/repositories/ResumeRepository";
import {
  GenerateResumeRequestDto,
  GeneratedResumeResultDto,
  AiOptimizeResumeRequestDto,
  AiOptimizeResumeResultDto,
} from "@interviewos/types";

/** Generous enough for a summary paragraph, tight enough to bound LLM cost per call. */
const MAX_TEXT_LENGTH = 4000;
const MAX_RESUME_TEXT_LENGTH = 20000;
const MAX_JD_TEXT_LENGTH = 10000;

export default class ResumeWriterService {
  constructor(
    private readonly agent: IResumeWriterAgent,
    private readonly resumeRepository?: ResumeRepository
  ) {}

  private ensureValidText(text: string): void {
    if (!text || !text.trim()) {
      throw new ApiError(400, "Text is required.", ErrorCode.BAD_REQUEST);
    }
    if (text.length > MAX_TEXT_LENGTH) {
      throw new ApiError(
        400,
        `Text is too long - keep it under ${MAX_TEXT_LENGTH} characters.`,
        ErrorCode.BAD_REQUEST
      );
    }
  }

  async checkGrammar(text: string): Promise<GrammarCheckResult> {
    this.ensureValidText(text);
    return this.agent.checkGrammar(text.trim());
  }

  async rewrite(text: string, options?: RewriteOptions): Promise<RewriteResult> {
    this.ensureValidText(text);
    return this.agent.rewrite(text.trim(), options);
  }

  async matchJobDescription(
    resumeText: string,
    jobDescription: string,
    options?: JDMatchOptions
  ): Promise<JDMatchResult> {
    if (!resumeText || !resumeText.trim()) {
      throw new ApiError(400, "Resume text is required.", ErrorCode.BAD_REQUEST);
    }
    if (!jobDescription || !jobDescription.trim()) {
      throw new ApiError(400, "Job description is required.", ErrorCode.BAD_REQUEST);
    }

    if (resumeText.length > MAX_RESUME_TEXT_LENGTH) {
      throw new ApiError(
        400,
        `Resume text is too long - keep under ${MAX_RESUME_TEXT_LENGTH} characters.`,
        ErrorCode.BAD_REQUEST
      );
    }

    if (jobDescription.length > MAX_JD_TEXT_LENGTH) {
      throw new ApiError(
        400,
        `Job description is too long - keep under ${MAX_JD_TEXT_LENGTH} characters.`,
        ErrorCode.BAD_REQUEST
      );
    }

    return this.agent.matchJobDescription(
      resumeText.trim(),
      jobDescription.trim(),
      options
    );
  }

  async generateResume(
    dto: GenerateResumeRequestDto,
    userId?: string
  ): Promise<GeneratedResumeResultDto> {
    if (!dto.targetRole || !dto.targetRole.trim()) {
      throw new ApiError(400, "Target role is required.", ErrorCode.BAD_REQUEST);
    }
    if (!Array.isArray(dto.skills) || dto.skills.length === 0) {
      throw new ApiError(400, "At least one skill is required.", ErrorCode.BAD_REQUEST);
    }

    let realExperience: any[] = [];
    let realEducation: any[] = [];
    let rawResumeText = dto.resumeText || "";

    if (this.resumeRepository) {
      let doc: any = null;
      if (dto.resumeId) {
        doc = await this.resumeRepository.findById(dto.resumeId);
      } else if (userId) {
        try {
          doc = await this.resumeRepository.findLatestByUser(new Types.ObjectId(userId));
        } catch {
          // Ignore if userId is not a valid ObjectId in mock/test
        }
      }

      if (doc) {
        if (Array.isArray(doc.experience) && doc.experience.length > 0) {
          realExperience = doc.experience;
        }
        if (Array.isArray(doc.education) && doc.education.length > 0) {
          realEducation = doc.education;
        }
        if (doc.rawText && !rawResumeText) {
          rawResumeText = doc.rawText;
        }
      }
    }

    return this.agent.generateResume({
      ...dto,
      realExperience,
      realEducation,
      rawResumeText,
    });
  }

  async optimizeResume(
    userId: string,
    dto: AiOptimizeResumeRequestDto
  ): Promise<AiOptimizeResumeResultDto> {
    let resumeData: any = {
      summary: "",
      rawText: dto.resumeText || "",
      extractedSkills: [],
      experience: [],
      projects: [],
      education: [],
      certifications: [],
    };

    let existingDoc: any = null;

    if (dto.resumeId && this.resumeRepository) {
      existingDoc = await this.resumeRepository.findById(dto.resumeId);
      if (existingDoc) {
        if (existingDoc.userId.toString() !== userId) {
          throw new ApiError(403, "You don't have access to this resume.", ErrorCode.FORBIDDEN);
        }
        resumeData = {
          summary: existingDoc.summary || "",
          rawText: existingDoc.rawText || "",
          extractedSkills: existingDoc.extractedSkills || [],
          experience: existingDoc.experience || [],
          projects: existingDoc.projects || [],
          education: existingDoc.education || [],
          certifications: existingDoc.certifications || [],
        };
      }
    }

    const optimizationResult = await this.agent.optimizeResume(
      resumeData,
      dto.jobDescription,
      dto.targetRole
    );

    if (dto.saveToMongo && existingDoc && this.resumeRepository) {
      await this.resumeRepository.updateFields(existingDoc.id, {
        summary: optimizationResult.improvedSummary,
        extractedSkills: optimizationResult.skills,
        experience: optimizationResult.experience,
        projects: optimizationResult.projects,
        education: optimizationResult.education,
        certifications: optimizationResult.certifications,
        atsScore: optimizationResult.optimizedAtsScore,
      });
      optimizationResult.mongoUpdated = true;
    }

    return optimizationResult;
  }

  async exportResumePdf(data: ExportResumeDto): Promise<Buffer> {
    if (!data.fullName || !data.fullName.trim()) {
      throw new ApiError(400, "Full name is required for resume export.", ErrorCode.BAD_REQUEST);
    }

    return buildResumePdf(data);
  }
}
