import { Types } from "mongoose";

import {
  InterviewSessionDocument,
  InterviewStatus,
  InterviewType,
  InterviewLevel,
} from "../../../modules/interview-session/types/interview-session.types";

import {
  ConversationDocument,
  ConversationRole,
  ConversationStatus,
} from "../../../modules/conversation/types/conversation.types";

export function makeInterviewFixture(): InterviewSessionDocument {
  return {
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(),
    title: "Frontend Engineer Interview",
    type: InterviewType.TECHNICAL,
    level: InterviewLevel.INTERMEDIATE,
    status: InterviewStatus.COMPLETED,
    duration: 1800,
    turnCount: 2,
    maxQuestions: 2,
    score: 0,
    feedback: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as InterviewSessionDocument;
}

export function makeConversationFixture(): ConversationDocument[] {
  const sessionId = new Types.ObjectId();

  return [
    {
      _id: new Types.ObjectId(),
      sessionId,
      turnNumber: 1,
      role: ConversationRole.AI,
      status: ConversationStatus.ANSWERED,
      question: "What is a closure in JavaScript?",
      answer: "A closure is a function bundled with its lexical scope.",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new Types.ObjectId(),
      sessionId,
      turnNumber: 2,
      role: ConversationRole.AI,
      status: ConversationStatus.ANSWERED,
      question: "How does the event loop work?",
      answer: "It processes the call stack, then microtasks, then macrotasks.",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ] as unknown as ConversationDocument[];
}
