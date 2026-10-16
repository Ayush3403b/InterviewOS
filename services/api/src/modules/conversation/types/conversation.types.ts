import { Document, Types } from "mongoose";

/* -------------------------------------------------------------------------- */
/*                                    Enums                                   */
/* -------------------------------------------------------------------------- */

export enum ConversationRole {
  AI = "AI",
  USER = "USER",
  SYSTEM = "SYSTEM",
}

export enum ConversationStatus {
  PENDING = "PENDING",
  ANSWERED = "ANSWERED",
  EVALUATED = "EVALUATED",
  SKIPPED = "SKIPPED",
}

/* -------------------------------------------------------------------------- */
/*                              Conversation Type                             */
/* -------------------------------------------------------------------------- */

export interface Conversation {
  sessionId: Types.ObjectId;

  turnNumber: number;

  role: ConversationRole;

  status: ConversationStatus;

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

/* -------------------------------------------------------------------------- */
/*                           Conversation Document                            */
/* -------------------------------------------------------------------------- */

export interface ConversationDocument
  extends Conversation,
    Document<Types.ObjectId> {}