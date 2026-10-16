import { Types } from "mongoose";

import {
  InterviewSessionDocument,
  InterviewStatus,
  InterviewType,
  InterviewLevel,
} from "../../modules/interview-session/types/interview-session.types";

import {
  ConversationDocument,
  ConversationRole,
  ConversationStatus,
} from "../../modules/conversation/types/conversation.types";

import { InterviewContextDocument } from "../../modules/interview-context/types/interview-context.types";

export function makeInterviewFixture(
  overrides: Partial<InterviewSessionDocument> = {}
): InterviewSessionDocument {
  const id = new Types.ObjectId();
  const userId = new Types.ObjectId();

  return {
    _id: id,
    id: id.toString(),
    userId,
    title: "Frontend Engineer Interview",
    type: InterviewType.TECHNICAL,
    level: InterviewLevel.INTERMEDIATE,
    status: InterviewStatus.IN_PROGRESS,
    duration: 0,
    turnCount: 0,
    maxQuestions: 3,
    score: 0,
    feedback: "",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as unknown as InterviewSessionDocument;
}

export function makeConversationTurnFixture(
  overrides: Partial<ConversationDocument> = {}
): ConversationDocument {
  const id = new Types.ObjectId();

  return {
    _id: id,
    id: id.toString(),
    sessionId: new Types.ObjectId(),
    turnNumber: 1,
    role: ConversationRole.AI,
    status: ConversationStatus.ANSWERED,
    question: "What is a closure in JavaScript?",
    answer: "A closure is a function bundled with its lexical scope.",
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as unknown as ConversationDocument;
}

export function makeInterviewContextFixture(
  overrides: Partial<InterviewContextDocument> = {}
): InterviewContextDocument {
  return {
    interviewSessionId: new Types.ObjectId(),
    transcriptSummary: "",
    topicsCovered: [],
    difficultyHistory: [],
    notes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as unknown as InterviewContextDocument;
}
