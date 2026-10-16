import { apiClient } from "../../lib/apiClient";
import type { InterviewReport } from "./types";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

/** Mirrors POST /api/v1/report/sessions/:sessionId/generate. */
export async function generateReport(sessionId: string): Promise<InterviewReport> {
  const res = await apiClient.post<ApiEnvelope<InterviewReport>>(
    `/report/sessions/${sessionId}/generate`
  );
  return res.data.data;
}

/** Mirrors GET /api/v1/report/sessions/:sessionId. */
export async function getReport(sessionId: string): Promise<InterviewReport | null> {
  const res = await apiClient.get<ApiEnvelope<InterviewReport | null>>(
    `/report/sessions/${sessionId}`
  );
  return res.data.data;
}

/**
 * Mirrors GET /api/v1/report/sessions/:sessionId/pdf - downloads the
 * PDF and triggers a browser save, rather than returning JSON.
 */
export async function downloadReportPdf(sessionId: string): Promise<void> {
  const res = await apiClient.get(`/report/sessions/${sessionId}/pdf`, {
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = url;
  link.download = `interview-report-${sessionId}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/** Mirrors POST /api/v1/report/sessions/:sessionId/share. */
export async function createReportShareLink(
  sessionId: string,
  expiresInDays = 30
): Promise<{ shareToken: string; shareUrl: string; shareExpiresAt?: string }> {
  const res = await apiClient.post<
    ApiEnvelope<{ shareToken: string; shareUrl: string; shareExpiresAt?: string }>
  >(`/report/sessions/${sessionId}/share`, { expiresInDays });
  return res.data.data;
}

/** Mirrors DELETE /api/v1/report/sessions/:sessionId/share. */
export async function revokeReportShareLink(sessionId: string): Promise<void> {
  await apiClient.delete(`/report/sessions/${sessionId}/share`);
}

/** Mirrors GET /api/v1/report/public/:shareToken. */
export async function getPublicReport(
  shareToken: string
): Promise<InterviewReport> {
  const res = await apiClient.get<ApiEnvelope<InterviewReport>>(
    `/report/public/${shareToken}`
  );
  return res.data.data;
}
