import { apiClient } from "../../lib/apiClient";
import type { ResumeAnalysis, ResumeComparison, ResumeVersionList } from "./types";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

/** Mirrors POST /api/v1/resumes (multipart: file, optional interviewSessionId). */
export async function uploadResume(
  file: File,
  interviewSessionId?: string
): Promise<ResumeAnalysis> {
  const formData = new FormData();
  formData.append("file", file);

  if (interviewSessionId) {
    formData.append("interviewSessionId", interviewSessionId);
  }

  const res = await apiClient.post<ApiEnvelope<ResumeAnalysis>>(
    "/resumes",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  return res.data.data;
}

/** Mirrors GET /api/v1/resumes/me. */
export async function getMyLatestResume(): Promise<ResumeAnalysis | null> {
  const res = await apiClient.get<ApiEnvelope<ResumeAnalysis | null>>(
    "/resumes/me"
  );
  return res.data.data;
}

/** Mirrors GET /api/v1/resumes/:id. */
export async function getResumeById(id: string): Promise<ResumeAnalysis> {
  const res = await apiClient.get<ApiEnvelope<ResumeAnalysis>>(
    `/resumes/${id}`
  );
  return res.data.data;
}

/**
 * Mirrors GET /api/v1/resumes/versions - every upload already creates
 * a new resume document rather than overwriting the last one, so
 * this is the full version history, newest first.
 */
export async function getResumeVersions(
  page = 1,
  limit = 20
): Promise<ResumeVersionList> {
  const res = await apiClient.get<ApiEnvelope<ResumeVersionList>>(
    "/resumes/versions",
    { params: { page, limit } }
  );
  return res.data.data;
}

/** Mirrors GET /api/v1/resumes/compare?from=&to=. */
export async function compareResumeVersions(
  fromId: string,
  toId: string
): Promise<ResumeComparison> {
  const res = await apiClient.get<ApiEnvelope<ResumeComparison>>(
    "/resumes/compare",
    { params: { from: fromId, to: toId } }
  );
  return res.data.data;
}

/** Mirrors PATCH /api/v1/resumes/:id */
export async function updateResume(
  id: string,
  updates: Record<string, unknown>
): Promise<ResumeAnalysis> {
  const res = await apiClient.patch<ApiEnvelope<ResumeAnalysis>>(
    `/resumes/${id}`,
    updates
  );
  return res.data.data;
}

/** Mirrors POST /api/v1/resumes/import/github */
export async function importGitHubProfile(payload: {
  username: string;
  githubToken?: string;
  maxRepos?: number;
}): Promise<ResumeAnalysis> {
  const res = await apiClient.post<ApiEnvelope<ResumeAnalysis>>(
    "/resumes/import/github",
    payload
  );
  return res.data.data;
}

/** Mirrors POST /api/v1/resumes/import/linkedin */
export async function importLinkedInProfile(payload: {
  profileData?: string;
  rawText?: string;
}): Promise<ResumeAnalysis> {
  const res = await apiClient.post<ApiEnvelope<ResumeAnalysis>>(
    "/resumes/import/linkedin",
    payload
  );
  return res.data.data;
}
