import {
  InterviewLevel,
  InterviewType,
} from "../types/interview-session.types";

export interface CreateInterviewSessionDto {
  /**
   * User-defined interview title.
   */
  title: string;

  /**
   * Interview category.
   */
  type: InterviewType;

  /**
   * Interview difficulty.
   */
  level: InterviewLevel;

  /**
   * Maximum AI conversation turns.
   * Optional because the model defaults it.
   */
  maxQuestions?: number;
}