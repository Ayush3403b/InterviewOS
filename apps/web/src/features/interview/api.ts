import { apiClient } from "../../lib/apiClient";

import type {
  CompleteSessionPayload,
  ConversationTurn,
  CreateTurnPayload,
  EvaluationResult,
  NextQuestionResponse,
  OrchestratorSubmitAnswerResult,
  SubmitAnswerPayload,
} from "./types";
import type { InterviewSessionDetail } from "../dashboard/types";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

/** Mirrors POST /api/v1/conversations. */
export async function createTurn(
  payload: CreateTurnPayload
): Promise<ConversationTurn> {
  const res = await apiClient.post<ApiEnvelope<ConversationTurn>>(
    "/conversations",
    payload
  );
  return res.data.data;
}

/** Mirrors PATCH /api/v1/conversations/:id/answer. */
export async function submitAnswer(
  turnId: string,
  payload: SubmitAnswerPayload
): Promise<ConversationTurn> {
  const res = await apiClient.patch<ApiEnvelope<ConversationTurn>>(
    `/conversations/${turnId}/answer`,
    payload
  );
  return res.data.data;
}

/** Mirrors POST /api/v1/interview-sessions/:id/complete. */
export async function completeInterviewSession(
  sessionId: string,
  payload: CompleteSessionPayload
): Promise<InterviewSessionDetail> {
  const res = await apiClient.post<ApiEnvelope<InterviewSessionDetail>>(
    `/interview-sessions/${sessionId}/complete`,
    payload
  );
  return res.data.data;
}

/** Mirrors POST /api/v1/evaluations. No organizationId - self-practice sessions have none. */
export async function createEvaluation(
  interviewSessionId: string,
  candidateId: string
): Promise<EvaluationResult> {
  const res = await apiClient.post<ApiEnvelope<EvaluationResult>>(
    "/evaluations",
    { interviewSessionId, candidateId }
  );
  return res.data.data;
}

/** Mirrors POST /api/v1/evaluations/:id/generate. Runs the real AI evaluation agent. */
export async function generateEvaluation(
  evaluationId: string
): Promise<EvaluationResult> {
  const res = await apiClient.post<ApiEnvelope<EvaluationResult>>(
    `/evaluations/${evaluationId}/generate`
  );
  return res.data.data;
}

/** Mirrors GET /api/v1/evaluations/interview/:interviewId. */
export async function getEvaluationByInterview(
  interviewSessionId: string
): Promise<EvaluationResult | null> {
  const res = await apiClient.get<ApiEnvelope<EvaluationResult | null>>(
    `/evaluations/interview/${interviewSessionId}`
  );
  return res.data.data;
}

/**
 * Orchestrator-backed flow (modules/orchestrator) - one call decides
 * question, follow-up, and difficulty together, replacing the manual
 * static-question-bank + createTurn sequence above for live sessions.
 */

/** Mirrors GET /api/v1/orchestrator/sessions/:sessionId/next-question. */
export async function getNextQuestion(
  sessionId: string
): Promise<NextQuestionResponse> {
  const res = await apiClient.get<ApiEnvelope<NextQuestionResponse>>(
    `/orchestrator/sessions/${sessionId}/next-question`
  );
  return res.data.data;
}

/** Mirrors POST /api/v1/orchestrator/turns/:turnId/answer. */
export async function submitOrchestratorAnswer(
  turnId: string,
  sessionId: string,
  answer: string,
  timeTaken?: number
): Promise<OrchestratorSubmitAnswerResult> {
  const res = await apiClient.post<ApiEnvelope<OrchestratorSubmitAnswerResult>>(
    `/orchestrator/turns/${turnId}/answer`,
    { answer, timeTaken, sessionId }
  );
  return res.data.data;
}

/** Mirrors POST /api/v1/orchestrator/sessions/:sessionId/finish. */
export async function finishInterview(
  sessionId: string,
  durationSeconds: number
): Promise<EvaluationResult> {
  const res = await apiClient.post<ApiEnvelope<EvaluationResult>>(
    `/orchestrator/sessions/${sessionId}/finish`,
    { durationSeconds }
  );
  return res.data.data;
}
