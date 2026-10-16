import { Types } from "mongoose";

import { BaseService } from "../../../shared/services/BaseService";
import { ApiError } from "../../../shared/errors/ApiError";
import { ErrorCode } from "../../../shared/errors/ErrorCode";

import { InterviewContextRepository } from "../repositories/InterviewContextRepository";
import { InterviewContextDocument } from "../types/interview-context.types";

export default class InterviewContextService extends BaseService<InterviewContextRepository> {
  constructor(repository: InterviewContextRepository) {
    super(repository);
  }

  private ensureValidObjectId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(
        400,
        "Invalid interview session id.",
        ErrorCode.BAD_REQUEST
      );
    }
  }

  async getOrCreate(
    interviewSessionId: string
  ): Promise<InterviewContextDocument> {
    this.ensureValidObjectId(interviewSessionId);

    return this.repository.getOrCreate(
      new Types.ObjectId(interviewSessionId)
    );
  }

  async setResumeSummary(
    interviewSessionId: string,
    resumeSummary: string
  ): Promise<InterviewContextDocument> {
    this.ensureValidObjectId(interviewSessionId);

    const updated = await this.repository.setResumeSummary(
      new Types.ObjectId(interviewSessionId),
      resumeSummary
    );

    if (!updated) {
      throw new ApiError(
        500,
        "Failed to store resume summary in interview context.",
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }

    return updated;
  }

  async appendTurn(
    interviewSessionId: string,
    data: {
      transcriptSummary: string;
      newTopics: string[];
      difficultyUsed: string;
      answerQuality: number;
      note?: string;
    }
  ): Promise<InterviewContextDocument> {
    this.ensureValidObjectId(interviewSessionId);

    const updated = await this.repository.appendTurn(
      new Types.ObjectId(interviewSessionId),
      data
    );

    if (!updated) {
      throw new ApiError(
        500,
        "Failed to update interview context.",
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }

    return updated;
  }

  async getContext(
    interviewSessionId: string
  ): Promise<InterviewContextDocument | null> {
    this.ensureValidObjectId(interviewSessionId);

    return this.repository.findByInterviewSession(interviewSessionId);
  }
}
