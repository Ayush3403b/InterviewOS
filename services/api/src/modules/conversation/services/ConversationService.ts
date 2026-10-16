import mongoose from "mongoose";

import { BaseService } from "../../../shared/services/BaseService";
import { ApiError } from "../../../shared/errors/ApiError";
import { ErrorCode } from "../../../shared/errors/ErrorCode";

import ConversationRepository from "../repositories/ConversationRepository";

import { CreateConversationTurnDto } from "../dtos/CreateConversationTurnDto";
import { UpdateConversationTurnDto } from "../dtos/UpdateConversationTurnDto";

import {
  ConversationDocument,
  ConversationStatus,
} from "../types/conversation.types";

class ConversationService extends BaseService<ConversationRepository> {
  constructor(repository: ConversationRepository) {
    super(repository);
  }

  /* -------------------------------------------------------------------------- */
  /*                              Private Helpers                               */
  /* -------------------------------------------------------------------------- */

  private ensureValidObjectId(id: string): void {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(
        400,
        "Invalid conversation id.",
        ErrorCode.BAD_REQUEST
      );
    }
  }

  private async ensureConversationExists(
    id: string
  ): Promise<ConversationDocument> {
    this.ensureValidObjectId(id);

    const conversation = await this.repository.findById(id);

    if (!conversation) {
      throw new ApiError(
        404,
        "Conversation not found.",
        ErrorCode.NOT_FOUND
      );
    }

    return conversation;
  }

  private ensureAnswered(
    conversation: ConversationDocument
  ): void {
    if (conversation.status !== ConversationStatus.ANSWERED) {
      throw new ApiError(
        400,
        "Conversation has not been answered yet.",
        ErrorCode.BAD_REQUEST
      );
    }
  }

  private ensureNotEvaluated(
    conversation: ConversationDocument
  ): void {
    if (conversation.status === ConversationStatus.EVALUATED) {
      throw new ApiError(
        409,
        "Conversation has already been evaluated.",
        ErrorCode.CONFLICT
      );
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                               Public Methods                               */
  /* -------------------------------------------------------------------------- */

  async createTurn(
    dto: CreateConversationTurnDto
  ): Promise<ConversationDocument> {
    return this.repository.createTurn({
      ...dto,
      sessionId: new mongoose.Types.ObjectId(dto.sessionId),
    });
  }

  async getConversationById(
    id: string
  ): Promise<ConversationDocument> {
    return this.ensureConversationExists(id);
  }

  async getConversationHistory(
    sessionId: string
  ): Promise<ConversationDocument[]> {
    this.ensureValidObjectId(sessionId);

    return this.repository.getConversationHistory(sessionId);
  }

  async getLatestTurn(
    sessionId: string
  ): Promise<ConversationDocument> {
    this.ensureValidObjectId(sessionId);

    const conversation =
      await this.repository.findLatestTurn(sessionId);

    if (!conversation) {
      throw new ApiError(
        404,
        "No conversation found for this session.",
        ErrorCode.NOT_FOUND
      );
    }

    return conversation;
  }

  async countTurns(sessionId: string): Promise<number> {
    this.ensureValidObjectId(sessionId);

    return this.repository.countTurns(sessionId);
  }

  async updateAnswer(
    id: string,
    answer: string,
    timeTaken?: number
  ): Promise<ConversationDocument> {
    const conversation =
      await this.ensureConversationExists(id);

    this.ensureNotEvaluated(conversation);

    const updatedConversation =
      await this.repository.updateAnswer(
        id,
        answer,
        timeTaken
      );

    if (!updatedConversation) {
      throw new ApiError(
        500,
        "Failed to update conversation answer.",
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }

    return updatedConversation;
  }

  async updateTranscript(
    id: string,
    speechTranscript: string
  ): Promise<ConversationDocument> {
    const conversation =
      await this.ensureConversationExists(id);

    this.ensureNotEvaluated(conversation);

    const updatedConversation =
      await this.repository.updateTranscript(
        id,
        speechTranscript
      );

    if (!updatedConversation) {
      throw new ApiError(
        500,
        "Failed to update transcript.",
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }

    return updatedConversation;
  }

  async updateTurn(
    id: string,
    dto: UpdateConversationTurnDto
  ): Promise<ConversationDocument> {
    const conversation =
      await this.ensureConversationExists(id);

    this.ensureNotEvaluated(conversation);

    const updatedConversation =
      await this.repository.updateTurn(id, dto);

    if (!updatedConversation) {
      throw new ApiError(
        500,
        "Failed to update conversation.",
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }

    return updatedConversation;
  }

  async markEvaluated(
    id: string
  ): Promise<ConversationDocument> {
    const conversation =
      await this.ensureConversationExists(id);

    this.ensureAnswered(conversation);

    this.ensureNotEvaluated(conversation);

    const updatedConversation =
      await this.repository.updateTurn(id, {
        status: ConversationStatus.EVALUATED,
      });

    if (!updatedConversation) {
      throw new ApiError(
        500,
        "Failed to mark conversation as evaluated.",
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }

    return updatedConversation;
  }

  async deleteTurn(id: string): Promise<void> {
    const conversation =
      await this.ensureConversationExists(id);

    this.ensureNotEvaluated(conversation);

    await this.repository.deleteTurn(id);
  }
}

export default ConversationService;