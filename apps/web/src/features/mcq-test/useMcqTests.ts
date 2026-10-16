import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  changeTestStatus,
  createTest,
  deleteTest,
  generateFromTopics,
  getAttemptReview,
  getResults,
  getTest,
  importFromFiles,
  listMyTests,
  replaceQuestions,
  updateTest,
  type TestLifecycleAction,
} from "./api";
import type {
  GenerateFromTopicsPayload,
  GenerationResult,
  ImportFromFilesPayload,
  McqQuestionInput,
  McqTestDetail,
  McqTestSettingsPayload,
} from "./types";

/* Author-side hooks. Candidate-side ones are in useMcqAttempt.ts. */

export function useMyTests() {
  return useQuery({ queryKey: ["mcq-tests"], queryFn: listMyTests });
}

export function useTest(id: string) {
  return useQuery({
    queryKey: ["mcq-test", id],
    queryFn: () => getTest(id),
    enabled: Boolean(id),
  });
}

/**
 * Every author mutation returns the updated test - write it straight
 * into the cache instead of refetching.
 */
function useTestMutation<TVariables>(
  id: string,
  mutationFn: (variables: TVariables) => Promise<McqTestDetail>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (test) => {
      queryClient.setQueryData(["mcq-test", id], test);
      queryClient.invalidateQueries({ queryKey: ["mcq-tests"] });
    },
  });
}

export function useCreateTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: McqTestSettingsPayload) => createTest(payload),
    onSuccess: (test) => {
      queryClient.setQueryData(["mcq-test", test.id], test);
      queryClient.invalidateQueries({ queryKey: ["mcq-tests"] });
    },
  });
}

export function useUpdateTest(id: string) {
  return useTestMutation(id, (payload: Partial<McqTestSettingsPayload>) =>
    updateTest(id, payload)
  );
}

export function useSaveQuestions(id: string) {
  return useTestMutation(id, (questions: McqQuestionInput[]) =>
    replaceQuestions(id, questions)
  );
}

export function useChangeTestStatus(id: string) {
  return useTestMutation(id, (action: TestLifecycleAction) =>
    changeTestStatus(id, action)
  );
}

function useGenerationMutation<TVariables>(
  id: string,
  mutationFn: (variables: TVariables) => Promise<GenerationResult>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (result) => {
      queryClient.setQueryData(["mcq-test", id], result.test);
      queryClient.invalidateQueries({ queryKey: ["mcq-tests"] });
    },
  });
}

export function useGenerateFromTopics(id: string) {
  return useGenerationMutation(id, (payload: GenerateFromTopicsPayload) =>
    generateFromTopics(id, payload)
  );
}

export function useImportFromFiles(id: string) {
  return useGenerationMutation(id, (payload: ImportFromFilesPayload) =>
    importFromFiles(id, payload)
  );
}

export function useDeleteTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTest(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mcq-tests"] }),
  });
}

export function useTestResults(id: string) {
  return useQuery({
    queryKey: ["mcq-test-results", id],
    queryFn: () => getResults(id),
    enabled: Boolean(id),
  });
}

export function useAttemptReview(id: string, attemptId: string) {
  return useQuery({
    queryKey: ["mcq-attempt-review", id, attemptId],
    queryFn: () => getAttemptReview(id, attemptId),
    enabled: Boolean(id && attemptId),
  });
}
