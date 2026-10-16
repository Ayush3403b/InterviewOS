import {
  ConversationRole,
  ConversationStatus,
} from "../types/conversation.types";

export interface CreateConversationTurnDto {
  sessionId: string;
    
  turnNumber: number;

  role: ConversationRole;

  question: string;

  answer?: string;

  speechTranscript?: string;

  status?: ConversationStatus;

  timeTaken?: number;

  tokensUsed?: number;

  provider?: string;

  llmmodel?: string;

  metadata?: Record<string, unknown>;
}