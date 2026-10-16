import { apiClient } from "../../lib/apiClient";
import type { CoachingPlan } from "./types";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

/** Mirrors POST /api/v1/coach/sessions/:sessionId/generate. */
export async function generateCoachingPlan(
  sessionId: string
): Promise<CoachingPlan> {
  const res = await apiClient.post<ApiEnvelope<CoachingPlan>>(
    `/coach/sessions/${sessionId}/generate`
  );
  return res.data.data;
}

/** Mirrors GET /api/v1/coach/sessions/:sessionId. */
export async function getCoachingPlan(
  sessionId: string
): Promise<CoachingPlan | null> {
  const res = await apiClient.get<ApiEnvelope<CoachingPlan | null>>(
    `/coach/sessions/${sessionId}`
  );
  return res.data.data;
}
