import {
  InterviewLevel,
  InterviewType,
} from "../types/interview-session.types";

export interface UpdateInterviewSessionDto {
  /**
   * Interview title.
   */
  title?: string;

  /**
   * Interview category.
   */
  type?: InterviewType;

  /**
   * Interview difficulty.
   */
  level?: InterviewLevel;

  /**
   * Maximum interview turns.
   */
  maxQuestions?: number;
}