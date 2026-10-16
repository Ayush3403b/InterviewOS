/** Mirrors ConversationRole / ConversationStatus (conversation.types.ts). */
export type ConversationRole = "AI" | "USER" | "SYSTEM";
export type ConversationStatus = "PENDING" | "ANSWERED" | "EVALUATED" | "SKIPPED";

/** Mirrors ConversationResponseDto. */
export interface ConversationTurn {
  id: string;
  sessionId: string;
  turnNumber: number;
  role: ConversationRole;
  status: ConversationStatus;
  question: string;
  answer?: string;
  speechTranscript?: string;
  timeTaken?: number;
}

export interface CreateTurnPayload {
  sessionId: string;
  turnNumber: number;
  role: ConversationRole;
  question: string;
  status?: ConversationStatus;
}

export interface SubmitAnswerPayload {
  answer: string;
  timeTaken?: number;
}

/** Mirrors HiringRecommendation. */
export type HiringRecommendation =
  | "STRONG_HIRE"
  | "HIRE"
  | "BORDERLINE"
  | "NO_HIRE";

/** Mirrors SkillScores. */
export interface SkillScores {
  technical: number;
  communication: number;
  problemSolving: number;
  confidence: number;
  leadership: number;
  criticalThinking: number;
}

/** Mirrors QuestionEvaluation. */
export interface QuestionEvaluationResult {
  turnNumber: number;
  question: string;
  answer: string;
  score: number;
  feedback: string;
}

/** Mirrors EvaluationResponse. */
export interface EvaluationResult {
  id: string;
  interviewSessionId: string;
  organizationId?: string;
  candidateId: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "PUBLISHED";
  overallScore: number;
  skillScores: SkillScores;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  overallSummary: string;
  hiringRecommendation: HiringRecommendation;
  questionEvaluations: QuestionEvaluationResult[];
}

export interface CompleteSessionPayload {
  score: number;
  feedback: string;
  duration: number;
}

/** Mirrors NextQuestionResult (InterviewOrchestrator.ts). */
export interface OrchestratorTurn {
  id: string;
  turnNumber: number;
  question: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  isFollowUp: boolean;
  topic: string;
}

export interface NextQuestionResponse {
  done: boolean;
  reason?: string;
  turn?: OrchestratorTurn;
}

/** Mirrors SubmitAnswerResult (InterviewOrchestrator.ts). */
export interface OrchestratorSubmitAnswerResult {
  turnId: string;
  topicsCovered: string[];
  transcriptSummary: string;
}
