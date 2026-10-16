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
  /**
   * Terminal, auto-assigned - not something a user ever explicitly
   * chooses. An IN_PROGRESS session with no activity for too long
   * (browser crash, network loss, someone just walking away) or a
   * PAUSED session that's never resumed both land here, lazily, the
   * next time anyone looks at that session - see
   * InterviewSessionService.ensureInterviewExists's staleness check.
   * Without this, a zombie IN_PROGRESS session blocks
   * findActiveSession forever with no way out except a manual cancel.
   */
  EXPIRED = "EXPIRED",
}

/**
 * ================================
 * Interview Type
 * ================================
 */
export enum InterviewType {
  TECHNICAL = "TECHNICAL",
  CODING = "CODING",
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
 * Interview Section Planning
 * ================================
 */
export type SectionName = "intro" | "behavioral" | "technical" | "wrap-up";

export interface SectionAllocation {
  name: SectionName;
  /** Total questions budgeted for this section. */
  maxQuestions: number;
  /** Questions asked so far in this section — updated by orchestrator. */
  questionsAsked: number;
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

  /**
   * Optional section-based interview plan.
   * When present, the planner advances through sections in order.
   * When absent, the flat maxQuestions budget is used instead.
   */
  sectionPlan?: SectionAllocation[];

  /** Target company name, used to select question templates (e.g. "Google"). */
  targetCompany?: string;

  /** Target role, used to select question templates (e.g. "Software Engineer"). */
  targetRole?: string;

  /** Whether the candidate provided consent for proctoring & automated scoring. */
  consentGiven?: boolean;

  /** Timestamp when consent was agreed to. */
  consentGivenAt?: Date;

  /** Version of the consent agreement agreed to. */
  consentVersion?: string;
}

/**
 * ================================
 * Mongoose Document
 * ================================
 */
export interface InterviewSessionDocument
  extends InterviewSession,
    Document<Types.ObjectId> {}