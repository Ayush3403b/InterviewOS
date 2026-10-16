import { ConversationDocument } from "../types/conversation.types";

export interface ConversationResponseDto {
  id: string;

  sessionId: string;

  turnNumber: number;

  role: string;

  status: string;

  question: string;

  answer?: string;

  speechTranscript?: string;

  timeTaken?: number;

  tokensUsed?: number;

  provider?: string;

  llmmodel?: string;

  metadata?: Record<string, unknown>;

  createdAt: Date;

  updatedAt: Date;
}

export interface ConversationSummaryDto {
  id: string;

  turnNumber: number;

  role: string;

  status: string;

  question: string;

  answer?: string;
}

export class ConversationResponse {
  static toResponse(
    conversation: ConversationDocument
  ): ConversationResponseDto {
    return {
      id: conversation.id,
      sessionId: conversation.sessionId.toString(),
      turnNumber: conversation.turnNumber,
      role: conversation.role,
      status: conversation.status,
      question: conversation.question,
      answer: conversation.answer,
      speechTranscript: conversation.speechTranscript,
      timeTaken: conversation.timeTaken,
      tokensUsed: conversation.tokensUsed,
      provider: conversation.provider,
      llmmodel: conversation.llmmodel,
      metadata: conversation.metadata,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }

  static toSummary(
    conversation: ConversationDocument
  ): ConversationSummaryDto {
    return {
      id: conversation.id,
      turnNumber: conversation.turnNumber,
      role: conversation.role,
      status: conversation.status,
      question: conversation.question,
      answer: conversation.answer,
    };
  }

  static toResponseList(
    conversations: ConversationDocument[]
  ): ConversationResponseDto[] {
    return conversations.map((conversation) =>
      this.toResponse(conversation)
    );
  }

  static toSummaryList(
    conversations: ConversationDocument[]
  ): ConversationSummaryDto[] {
    return conversations.map((conversation) =>
      this.toSummary(conversation)
    );
  }
}

export default ConversationResponse;