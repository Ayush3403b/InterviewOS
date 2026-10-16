import { Document, Types } from "mongoose";

/**
 * ================================================================
 * Interview Context ("AI Memory")
 * ================================================================
 *
 * One document per interview session. This is the shared memory
 * every AI agent reads from and writes to, instead of each LLM call
 * being isolated:
 *
 *   Resume -> Conversation -> Previous Questions -> Evaluation -> Next Question
 *
 * The Question Agent reads `transcriptSummary` + `topicsCovered` to
 * avoid repeating ground already covered. The Conversation Agent
 * updates them after every answer. The Planner reads
 * `difficultyHistory` to decide whether to escalate or ease off.
 */
export interface InterviewContext {
  interviewSessionId: Types.ObjectId;

  /** Set once, from the Resume Agent, if a resume was attached. */
  resumeSummary?: string;

  /** Running summary of the conversation so far, rewritten after each turn. */
  transcriptSummary: string;

  /** Topics/skills touched on so far, so the next question can branch out. */
  topicsCovered: string[];

  /** Difficulty actually used for each question asked, in order. */
  difficultyHistory: string[];

  /**
   * Conversation Agent's rough 0-100 answerQuality read for each
   * answered turn, in order, parallel to difficultyHistory.
   */
  answerQualityHistory: number[];

  /** Free-form notes agents can attach (e.g. planner rationale). */
  notes: string[];

  updatedAt: Date;

  createdAt: Date;
}

export interface InterviewContextDocument
  extends InterviewContext,
    Document<Types.ObjectId> {}
