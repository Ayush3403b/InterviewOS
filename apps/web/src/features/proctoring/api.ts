import { apiClient } from "../../lib/apiClient";
import type {
  ProctoringEventReviewStatus,
  ProctoringEventSummary,
  ProctoringReport,
  ProctoringSessionSummary,
} from "./reportTypes";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

/** Mirrors GET /api/v1/proctoring/sessions/:interviewSessionId. */
export async function getProctoringSession(
  interviewSessionId: string
): Promise<ProctoringSessionSummary> {
  const res = await apiClient.get<ApiEnvelope<ProctoringSessionSummary>>(
    `/proctoring/sessions/${interviewSessionId}`
  );
  return res.data.data;
}

/** Mirrors GET /api/v1/proctoring/sessions/:interviewSessionId/events. */
export async function getProctoringEvents(
  interviewSessionId: string
): Promise<ProctoringEventSummary[]> {
  const res = await apiClient.get<ApiEnvelope<ProctoringEventSummary[]>>(
    `/proctoring/sessions/${interviewSessionId}/events`
  );
  return res.data.data;
}

/** Mirrors GET /api/v1/proctoring/sessions/:interviewSessionId/report. */
export async function getProctoringReport(
  interviewSessionId: string
): Promise<ProctoringReport> {
  const res = await apiClient.get<ApiEnvelope<ProctoringReport>>(
    `/proctoring/sessions/${interviewSessionId}/report`
  );
  return res.data.data;
}

/**
 * Mirrors GET /api/v1/proctoring/sessions/:interviewSessionId/timeline -
 * the full chronological event history, distinct from the paginated
 * `getProctoringEvents` above. The report already includes this same
 * list, so prefer `useProctoringReport` unless you specifically need
 * the timeline without the rest of the report.
 */
export async function getProctoringTimeline(
  interviewSessionId: string
): Promise<ProctoringEventSummary[]> {
  const res = await apiClient.get<ApiEnvelope<ProctoringEventSummary[]>>(
    `/proctoring/sessions/${interviewSessionId}/timeline`
  );
  return res.data.data;
}

/**
 * Mirrors PATCH /api/v1/proctoring/sessions/:interviewSessionId/events/:eventId/status.
 * Recruiter/org-staff only - the backend enforces this regardless of
 * who calls it.
 */
export async function updateProctoringEventStatus(
  interviewSessionId: string,
  eventId: string,
  status: Extract<ProctoringEventReviewStatus, "ACKNOWLEDGED" | "DISMISSED">
): Promise<ProctoringEventSummary> {
  const res = await apiClient.patch<ApiEnvelope<ProctoringEventSummary>>(
    `/proctoring/sessions/${interviewSessionId}/events/${eventId}/status`,
    { status }
  );
  return res.data.data;
}

/**
 * Mirrors GET /api/v1/proctoring/sessions/flagged - recruiter/faculty/
 * admin/super_admin only, the backend enforces this regardless of who
 * calls it. `organizationId` narrows to one org; omit for all.
 */
export async function getFlaggedSessions(
  organizationId?: string
): Promise<ProctoringSessionSummary[]> {
  const res = await apiClient.get<ApiEnvelope<ProctoringSessionSummary[]>>(
    "/proctoring/sessions/flagged",
    { params: organizationId ? { organizationId } : undefined }
  );
  return res.data.data;
}
