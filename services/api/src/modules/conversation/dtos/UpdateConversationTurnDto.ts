import { ConversationStatus } from "../types/conversation.types";

export interface UpdateConversationTurnDto {
  answer?: string;

  speechTranscript?: string;

  status?: ConversationStatus;

  timeTaken?: number;

  tokensUsed?: number;

  provider?: string;

  llmmodel?: string;

  metadata?: Record<string, unknown>;
}