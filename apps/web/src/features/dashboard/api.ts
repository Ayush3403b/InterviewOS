import { apiClient } from "../../lib/apiClient";

import type {
  CreateSessionPayload,
  InterviewSessionDetail,
  InterviewSessionSummary,
  InterviewStatistics,
} from "./types";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

/** Mirrors GET /api/v1/interview-sessions (InterviewSessionRoutes.ts). */
export async function getMySessions(
  page: number,
  limit: number
): Promise<InterviewSessionSummary[]> {
  const res = await apiClient.get<ApiEnvelope<InterviewSessionSummary[]>>(
    "/interview-sessions",
    { params: { page, limit } }
  );
  return res.data.data;
}

/** Mirrors GET /api/v1/interview-sessions/statistics. */
export async function getStatistics(): Promise<InterviewStatistics> {
  const res = await apiClient.get<ApiEnvelope<InterviewStatistics>>(
    "/interview-sessions/statistics"
  );
  return res.data.data;
}

/** Mirrors POST /api/v1/interview-sessions. */
export async function createSession(
  payload: CreateSessionPayload
): Promise<InterviewSessionDetail> {
  const res = await apiClient.post<ApiEnvelope<InterviewSessionDetail>>(
    "/interview-sessions",
    payload
  );
  return res.data.data;
}

/** Mirrors GET /api/v1/interview-sessions/:id. */
export async function getSessionById(
  id: string
): Promise<InterviewSessionDetail> {
  const res = await apiClient.get<ApiEnvelope<InterviewSessionDetail>>(
    `/interview-sessions/${id}`
  );
  return res.data.data;
}

/** Mirrors POST /api/v1/interview-sessions/:id/start. */
export async function startSession(
  id: string
): Promise<InterviewSessionDetail> {
  const res = await apiClient.post<ApiEnvelope<InterviewSessionDetail>>(
    `/interview-sessions/${id}/start`
  );
  return res.data.data;
}

/** Mirrors POST /api/v1/interview-sessions/:id/pause. */
export async function pauseSession(
  id: string
): Promise<InterviewSessionDetail> {
  const res = await apiClient.post<ApiEnvelope<InterviewSessionDetail>>(
    `/interview-sessions/${id}/pause`
  );
  return res.data.data;
}

/** Mirrors POST /api/v1/interview-sessions/:id/resume. */
export async function resumeSession(
  id: string
): Promise<InterviewSessionDetail> {
  const res = await apiClient.post<ApiEnvelope<InterviewSessionDetail>>(
    `/interview-sessions/${id}/resume`
  );
  return res.data.data;
}

/** Mirrors POST /api/v1/interview-sessions/:id/cancel. */
export async function cancelSession(
  id: string
): Promise<InterviewSessionDetail> {
  const res = await apiClient.post<ApiEnvelope<InterviewSessionDetail>>(
    `/interview-sessions/${id}/cancel`
  );
  return res.data.data;
}

/** Mirrors DELETE /api/v1/interview-sessions/:id. */
export async function deleteSession(id: string): Promise<void> {
  await apiClient.delete(`/interview-sessions/${id}`);
}
