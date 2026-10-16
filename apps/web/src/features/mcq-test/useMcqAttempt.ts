import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getAttempt,
  listMyAttempts,
  previewTest,
  saveAnswer,
  startAttempt,
  submitAttempt,
} from "./api";
import type { McqCandidateAttempt, McqSubmitReason } from "./types";

/* Candidate-side hooks. Author-side ones are in useMcqTests.ts. */

export function useTestPreview(code: string) {
  return useQuery({
    queryKey: ["mcq-preview", code],
    queryFn: () => previewTest(code),
    enabled: Boolean(code),
    retry: false,
  });
}

export function useMyAttempts() {
  return useQuery({ queryKey: ["mcq-my-attempts"], queryFn: listMyAttempts });
}

export function useAttempt(attemptId: string | null) {
  return useQuery({
    queryKey: ["mcq-attempt", attemptId],
    queryFn: () => getAttempt(attemptId as string),
    enabled: Boolean(attemptId),
  });
}

export function useStartAttempt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code: string) => startAttempt(code),
    onSuccess: (attempt) => {
      queryClient.setQueryData(["mcq-attempt", attempt.id], attempt);
    },
  });
}

export function useSaveAnswer(attemptId: string) {
  return useMutation({
    mutationFn: ({
      questionId,
      selectedOptionIndex,
    }: {
      questionId: string;
      selectedOptionIndex: number | null;
    }) => saveAnswer(attemptId, questionId, selectedOptionIndex),
  });
}

export function useSubmitAttempt(attemptId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reason: McqSubmitReason) => submitAttempt(attemptId, reason),
    onSuccess: (attempt: McqCandidateAttempt) => {
      queryClient.setQueryData(["mcq-attempt", attempt.id], attempt);
      queryClient.invalidateQueries({ queryKey: ["mcq-my-attempts"] });
    },
  });
}
