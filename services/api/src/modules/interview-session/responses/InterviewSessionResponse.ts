import { InterviewSessionDocument } from "../types/interview-session.types";

/**
 * Response returned to clients.
 * Keeps internal mongoose fields hidden.
 */
export interface InterviewSessionResponseDto {
  id: string;

  title: string;

  type: string;

  level: string;

  status: string;

  duration: number;

  turnCount: number;

  maxQuestions: number;

  score: number;

  feedback: string;

  startedAt: Date | null;

  completedAt: Date | null;

  createdAt: Date;

  updatedAt: Date;
}

/**
 * Lightweight response for interview listing.
 */
export interface InterviewSessionSummaryDto {
  id: string;

  title: string;

  type: string;

  level: string;

  status: string;

  score: number;

  duration: number;

  createdAt: Date;
}

/**
 * Dashboard statistics response.
 */
export interface InterviewStatisticsResponseDto {
  totalInterviews: number;

  completedInterviews: number;

  averageScore: number;

  totalDuration: number;
}

export class InterviewSessionResponse {
  /**
   * Full interview response
   */
  static toResponse(
    interview: InterviewSessionDocument
  ): InterviewSessionResponseDto {
    return {
      id: interview._id.toString(),

      title: interview.title,

      type: interview.type,

      level: interview.level,

      status: interview.status,

      duration: interview.duration,

      turnCount: interview.turnCount,

      maxQuestions: interview.maxQuestions,

      score: interview.score,

      feedback: interview.feedback,

      startedAt: interview.startedAt ?? null,

      completedAt: interview.completedAt ?? null,

      createdAt: interview.createdAt,

      updatedAt: interview.updatedAt,
    };
  }

  /**
   * List response
   */
  static toSummary(
    interview: InterviewSessionDocument
  ): InterviewSessionSummaryDto {
    return {
      id: interview._id.toString(),

      title: interview.title,

      type: interview.type,

      level: interview.level,

      status: interview.status,

      score: interview.score,

      duration: interview.duration,

      createdAt: interview.createdAt,
    };
  }

  /**
   * Multiple interviews
   */
  static toResponseList(
    interviews: InterviewSessionDocument[]
  ): InterviewSessionResponseDto[] {
    return interviews.map((interview) =>
      this.toResponse(interview)
    );
  }

  /**
   * Multiple interview summaries
   */
  static toSummaryList(
    interviews: InterviewSessionDocument[]
  ): InterviewSessionSummaryDto[] {
    return interviews.map((interview) =>
      this.toSummary(interview)
    );
  }

  /**
   * Dashboard statistics
   */
  static toStatistics(
    statistics: any
  ): InterviewStatisticsResponseDto {
    if (!statistics || statistics.length === 0) {
      return {
        totalInterviews: 0,
        completedInterviews: 0,
        averageScore: 0,
        totalDuration: 0,
      };
    }

    const stats = statistics[0];

    return {
      totalInterviews: stats.totalInterviews ?? 0,
      completedInterviews: stats.completedInterviews ?? 0,
      averageScore: Math.round(stats.averageScore ?? 0),
      totalDuration: stats.totalDuration ?? 0,
    };
  }
}