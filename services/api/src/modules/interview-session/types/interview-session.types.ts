import { Document, Types } from "mongoose";

/**
 * ================================
 * Interview Status
 * ================================
 */
export enum InterviewStatus {
  CREATED = "CREATED",
  IN_PROGRESS = "IN_PROGRESS",
  PAUSED = "PAUSED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

/**
 * ================================
 * Interview Type
 * ================================
 */
export enum InterviewType {
  TECHNICAL = "TECHNICAL",
  HR = "HR",
  SYSTEM_DESIGN = "SYSTEM_DESIGN",
  BEHAVIORAL = "BEHAVIORAL",
  MIXED = "MIXED",
}

/**
 * ================================
 * Interview Difficulty
 * ================================
 */
export enum InterviewLevel {
  BEGINNER = "BEGINNER",
  INTERMEDIATE = "INTERMEDIATE",
  ADVANCED = "ADVANCED",
}

/**
 * ================================
 * Interview Session Entity
 * ================================
 */
export interface InterviewSession {
  /**
   * Owner
   */
  userId: Types.ObjectId;

  /**
   * User-defined interview title
   */
  title: string;

  /**
   * Interview category
   */
  type: InterviewType;

  /**
   * Selected difficulty level
   */
  level: InterviewLevel;

  /**
   * Current lifecycle state
   */
  status: InterviewStatus;

  /**
   * Duration in seconds
   */
  duration: number;

  /**
   * Completed AI ↔ Candidate conversation turns
   */
  turnCount: number;

  /**
   * Maximum turns allowed
   */
  maxQuestions: number;

  /**
   * Final score (0–100)
   */
  score: number;

  /**
   * Final AI-generated feedback
   */
  feedback: string;

  /**
   * Interview start timestamp
   */
  startedAt?: Date;

  /**
   * Interview completion timestamp
   */
  completedAt?: Date;

  /**
   * Auto-managed timestamps
   */
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ================================
 * Mongoose Document
 * ================================
 */
export interface InterviewSessionDocument
  extends InterviewSession,
    Document<Types.ObjectId> {}