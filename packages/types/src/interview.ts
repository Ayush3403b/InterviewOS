import { z } from "zod";

export type InterviewType = "TECHNICAL" | "BEHAVIORAL" | "SYSTEM_DESIGN" | "MIXED";
export type InterviewLevel = "JUNIOR" | "MID" | "SENIOR" | "STAFF" | "LEAD";
export type InterviewStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "PAUSED"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED";

export interface QuestionTurnDto {
  turnNumber: number;
  question: string;
  category: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  expectedKeyPoints?: string[];
  candidateAnswer?: string;
  codeSnippet?: string;
  feedback?: string;
  score?: number;
  durationSeconds?: number;
}

export interface InterviewSessionDto {
  id: string;
  candidateId: string;
  candidateName: string;
  title: string;
  type: InterviewType;
  level: InterviewLevel;
  targetRole: string;
  status: InterviewStatus;
  currentTurn: number;
  totalTurns: number;
  turns: QuestionTurnDto[];
  proctoringSessionId?: string;
  reportId?: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
}

export const CreateInterviewSessionSchema = z.object({
  title: z.string().min(3).max(100),
  type: z.enum(["TECHNICAL", "BEHAVIORAL", "SYSTEM_DESIGN", "MIXED"]),
  level: z.enum(["JUNIOR", "MID", "SENIOR", "STAFF", "LEAD"]),
  targetRole: z.string().min(2).max(100),
  totalTurns: z.number().int().min(3).max(15).default(5),
});

export type CreateInterviewSessionInput = z.infer<typeof CreateInterviewSessionSchema>;

export const SubmitAnswerSchema = z.object({
  answer: z.string().min(1),
  code: z.string().optional(),
  language: z.string().optional(),
});

export type SubmitAnswerInput = z.infer<typeof SubmitAnswerSchema>;
