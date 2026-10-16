import { apiClient } from "../../lib/apiClient";

import type {
  GenerateFromTopicsPayload,
  GenerationResult,
  ImportFromFilesPayload,
  McqAttemptReview,
  McqCandidateAttempt,
  McqMyAttempt,
  McqQuestionInput,
  McqSubmitReason,
  McqTestDetail,
  McqTestPreview,
  McqTestResults,
  McqTestSettingsPayload,
  McqTestSummary,
} from "./types";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

/* -------------------------------------------------------------------------- */
/*                         Authors - McqTestRoutes.ts                          */
/* -------------------------------------------------------------------------- */

/** Mirrors GET /api/v1/mcq-tests. */
export async function listMyTests(): Promise<McqTestSummary[]> {
  const res = await apiClient.get<ApiEnvelope<McqTestSummary[]>>("/mcq-tests");
  return res.data.data;
}

/** Mirrors POST /api/v1/mcq-tests. */
export async function createTest(payload: McqTestSettingsPayload): Promise<McqTestDetail> {
  const res = await apiClient.post<ApiEnvelope<McqTestDetail>>("/mcq-tests", payload);
  return res.data.data;
}

/** Mirrors GET /api/v1/mcq-tests/:id. */
export async function getTest(id: string): Promise<McqTestDetail> {
  const res = await apiClient.get<ApiEnvelope<McqTestDetail>>(`/mcq-tests/${id}`);
  return res.data.data;
}

/** Mirrors PATCH /api/v1/mcq-tests/:id (drafts only). */
export async function updateTest(
  id: string,
  payload: Partial<McqTestSettingsPayload>
): Promise<McqTestDetail> {
  const res = await apiClient.patch<ApiEnvelope<McqTestDetail>>(`/mcq-tests/${id}`, payload);
  return res.data.data;
}

/** Mirrors DELETE /api/v1/mcq-tests/:id (only before anyone has taken it). */
export async function deleteTest(id: string): Promise<void> {
  await apiClient.delete(`/mcq-tests/${id}`);
}

/** Mirrors PUT /api/v1/mcq-tests/:id/questions - saves the whole list. */
export async function replaceQuestions(
  id: string,
  questions: McqQuestionInput[]
): Promise<McqTestDetail> {
  const res = await apiClient.put<ApiEnvelope<McqTestDetail>>(
    `/mcq-tests/${id}/questions`,
    { questions }
  );
  return res.data.data;
}

/** Mirrors POST /api/v1/mcq-tests/:id/questions/generate. */
export async function generateFromTopics(
  id: string,
  payload: GenerateFromTopicsPayload
): Promise<GenerationResult> {
  const res = await apiClient.post<ApiEnvelope<GenerationResult>>(
    `/mcq-tests/${id}/questions/generate`,
    payload
  );
  return res.data.data;
}

/** Mirrors POST /api/v1/mcq-tests/:id/questions/import (multipart). */
export async function importFromFiles(
  id: string,
  payload: ImportFromFilesPayload
): Promise<GenerationResult> {
  const form = new FormData();
  for (const file of payload.files) {
    form.append("files", file);
  }
  form.append("count", String(payload.count));
  form.append("difficulty", payload.difficulty);
  form.append("mode", payload.mode);
  if (payload.instructions) {
    form.append("instructions", payload.instructions);
  }

  const res = await apiClient.post<ApiEnvelope<GenerationResult>>(
    `/mcq-tests/${id}/questions/import`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data.data;
}

export type TestLifecycleAction = "publish" | "close" | "reopen" | "revert-to-draft";

/** Mirrors POST /api/v1/mcq-tests/:id/{publish|close|reopen|revert-to-draft}. */
export async function changeTestStatus(
  id: string,
  action: TestLifecycleAction
): Promise<McqTestDetail> {
  const res = await apiClient.post<ApiEnvelope<McqTestDetail>>(`/mcq-tests/${id}/${action}`);
  return res.data.data;
}

/** Mirrors GET /api/v1/mcq-tests/:id/attempts. */
export async function getResults(id: string): Promise<McqTestResults> {
  const res = await apiClient.get<ApiEnvelope<McqTestResults>>(`/mcq-tests/${id}/attempts`);
  return res.data.data;
}

/** Mirrors GET /api/v1/mcq-tests/:id/attempts/:attemptId. */
export async function getAttemptReview(
  id: string,
  attemptId: string
): Promise<McqAttemptReview> {
  const res = await apiClient.get<ApiEnvelope<McqAttemptReview>>(
    `/mcq-tests/${id}/attempts/${attemptId}`
  );
  return res.data.data;
}

/* -------------------------------------------------------------------------- */
/*                      Candidates - McqAttemptRoutes.ts                       */
/* -------------------------------------------------------------------------- */

/** Mirrors GET /api/v1/mcq-attempts/access/:code. */
export async function previewTest(code: string): Promise<McqTestPreview> {
  const res = await apiClient.get<ApiEnvelope<McqTestPreview>>(
    `/mcq-attempts/access/${encodeURIComponent(code)}`
  );
  return res.data.data;
}

/** Mirrors POST /api/v1/mcq-attempts/access/:code - starts or resumes. */
export async function startAttempt(code: string): Promise<McqCandidateAttempt> {
  const res = await apiClient.post<ApiEnvelope<McqCandidateAttempt>>(
    `/mcq-attempts/access/${encodeURIComponent(code)}`
  );
  return res.data.data;
}

/** Mirrors GET /api/v1/mcq-attempts/mine. */
export async function listMyAttempts(): Promise<McqMyAttempt[]> {
  const res = await apiClient.get<ApiEnvelope<McqMyAttempt[]>>("/mcq-attempts/mine");
  return res.data.data;
}

/** Mirrors GET /api/v1/mcq-attempts/:attemptId. */
export async function getAttempt(attemptId: string): Promise<McqCandidateAttempt> {
  const res = await apiClient.get<ApiEnvelope<McqCandidateAttempt>>(
    `/mcq-attempts/${attemptId}`
  );
  return res.data.data;
}

/** Mirrors PUT /api/v1/mcq-attempts/:attemptId/answers. */
export async function saveAnswer(
  attemptId: string,
  questionId: string,
  selectedOptionIndex: number | null
): Promise<void> {
  await apiClient.put(`/mcq-attempts/${attemptId}/answers`, {
    questionId,
    selectedOptionIndex,
  });
}

/** Mirrors POST /api/v1/mcq-attempts/:attemptId/submit. */
export async function submitAttempt(
  attemptId: string,
  reason: McqSubmitReason
): Promise<McqCandidateAttempt> {
  const res = await apiClient.post<ApiEnvelope<McqCandidateAttempt>>(
    `/mcq-attempts/${attemptId}/submit`,
    { reason }
  );
  return res.data.data;
}
