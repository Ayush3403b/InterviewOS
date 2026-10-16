import { IQuestionAgent, GeneratedQuestion } from "./IQuestionAgent";
import { adaptDifficulty } from "./adaptDifficulty";

import { InterviewSessionDocument } from "../../modules/interview-session/types/interview-session.types";
import { ConversationDocument } from "../../modules/conversation/types/conversation.types";
import { InterviewContextDocument } from "../../modules/interview-context/types/interview-context.types";
import { InterviewType, SectionName } from "../../modules/interview-session/types/interview-session.types";

const QUESTION_POOLS: Record<InterviewType, string[]> = {
  [InterviewType.TECHNICAL]: [
    "Walk me through how you'd debug a production issue you've never seen before.",
    "Describe a time you had to optimize a slow piece of code. What did you do?",
    "How do you decide between a SQL and a NoSQL database for a new project?",
    "Explain a technical decision you made that you'd make differently today.",
    "How do you approach writing tests for a feature with tight deadlines?",
  ],
  [InterviewType.CODING]: [
    "Write a function to find the longest substring without repeating characters. What is the time complexity?",
    "Implement an LRU Cache with get and put methods operating in O(1) average time.",
    "Given an array of integers, return the indices of the two numbers such that they add up to a specific target.",
    "Implement a function to validate if a given binary tree is a valid Binary Search Tree (BST).",
    "Write an algorithm to merge K sorted linked lists and analyze its space and time complexity.",
  ],
  [InterviewType.HR]: [
    "Tell me about yourself and what you're looking for next.",
    "Why are you interested in this role specifically?",
    "Describe a time you disagreed with a teammate. How did you handle it?",
    "What's a piece of feedback that changed how you work?",
    "Where do you see yourself in three years?",
  ],
  [InterviewType.SYSTEM_DESIGN]: [
    "Design a URL shortener that can handle millions of requests a day.",
    "How would you design the backend for a real-time chat application?",
    "Walk through how you'd design a notification system across email, SMS, and push.",
    "How would you shard a database that's outgrown a single instance?",
    "Design a system to detect duplicate content across millions of documents.",
  ],
  [InterviewType.BEHAVIORAL]: [
    "Tell me about a time you failed. What did you learn?",
    "Describe a situation where you had to persuade someone who disagreed with you.",
    "Tell me about a time you took ownership of something outside your job description.",
    "Describe the most challenging deadline you've faced and how you handled it.",
    "Tell me about a time you received critical feedback. How did you respond?",
  ],
  [InterviewType.MIXED]: [
    "Walk me through how you'd debug a production issue you've never seen before.",
    "Tell me about a time you failed. What did you learn?",
    "Why are you interested in this role specifically?",
    "Describe a time you had to optimize a slow piece of code. What did you do?",
    "Tell me about a time you took ownership of something outside your job description.",
  ],
};

/**
 * No LLM call, no cost, fully deterministic - the same role
 * MockEvaluationAgent plays for evaluation. Used when
 * AI_QUESTION_PROVIDER=mock, and as the orchestrator's last-resort
 * fallback if the real question agent errors out mid-interview.
 */
export class MockQuestionAgent implements IQuestionAgent {
  async generateNextQuestion(
    interview: InterviewSessionDocument,
    context: InterviewContextDocument | null,
    previousTurns: ConversationDocument[],
    _currentSection?: SectionName
  ): Promise<GeneratedQuestion> {
    const pool = QUESTION_POOLS[interview.type];
    const index = previousTurns.length % pool.length;

    const difficulty = adaptDifficulty(
      interview.level,
      context?.difficultyHistory ?? [],
      context?.answerQualityHistory ?? []
    );

    return {
      question: pool[index],
      difficulty,
      isFollowUp: false,
      topic: interview.type,
      rationale: "Deterministic mock question (no AI provider configured).",
    };
  }
}
