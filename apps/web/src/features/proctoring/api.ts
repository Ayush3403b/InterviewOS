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

/** Mirrors GET /api/v1/proctoring/sessions/:subjectId. */
export async function getProctoringSession(
  subjectId: string
): Promise<ProctoringSessionSummary> {
  const res = await apiClient.get<ApiEnvelope<ProctoringSessionSummary>>(
    `/proctoring/sessions/${subjectId}`
  );
  return res.data.data;
}

/** Mirrors GET /api/v1/proctoring/sessions/:subjectId/events. */
export async function getProctoringEvents(
  subjectId: string
): Promise<ProctoringEventSummary[]> {
  const res = await apiClient.get<ApiEnvelope<ProctoringEventSummary[]>>(
    `/proctoring/sessions/${subjectId}/events`
  );
  return res.data.data;
}

/** Mirrors GET /api/v1/proctoring/sessions/:subjectId/report. */
export async function getProctoringReport(
  subjectId: string
): Promise<ProctoringReport> {
  const res = await apiClient.get<ApiEnvelope<ProctoringReport>>(
    `/proctoring/sessions/${subjectId}/report`
  );
  return res.data.data;
}

/**
 * Mirrors GET /api/v1/proctoring/sessions/:subjectId/timeline -
 * the full chronological event history, distinct from the paginated
 * `getProctoringEvents` above. The report already includes this same
 * list, so prefer `useProctoringReport` unless you specifically need
 * the timeline without the rest of the report.
 */
export async function getProctoringTimeline(
  subjectId: string
): Promise<ProctoringEventSummary[]> {
  const res = await apiClient.get<ApiEnvelope<ProctoringEventSummary[]>>(
    `/proctoring/sessions/${subjectId}/timeline`
  );
  return res.data.data;
}

/**
 * Mirrors PATCH /api/v1/proctoring/sessions/:subjectId/events/:eventId/status.
 * Recruiter/org-staff only - the backend enforces this regardless of
 * who calls it.
 */
export async function updateProctoringEventStatus(
  subjectId: string,
  eventId: string,
  status: Extract<ProctoringEventReviewStatus, "ACKNOWLEDGED" | "DISMISSED">
): Promise<ProctoringEventSummary> {
  const res = await apiClient.patch<ApiEnvelope<ProctoringEventSummary>>(
    `/proctoring/sessions/${subjectId}/events/${eventId}/status`,
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
