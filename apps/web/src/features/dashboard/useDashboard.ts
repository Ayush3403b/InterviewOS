import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createSession,
  deleteSession,
  getMySessions,
  getStatistics,
  startSession,
} from "./api";
import type { CreateSessionPayload } from "./types";

const SESSIONS_LIMIT = 10;

export function useStatistics() {
  return useQuery({
    queryKey: ["interview-statistics"],
    queryFn: getStatistics,
  });
}

export function useSessions(page: number) {
  return useQuery({
    queryKey: ["interview-sessions", page],
    queryFn: () => getMySessions(page, SESSIONS_LIMIT),
    placeholderData: (previous) => previous,
  });
}

export { SESSIONS_LIMIT };

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSessionPayload) => createSession(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interview-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["interview-statistics"] });
    },
  });
}

export function useStartSession() {
  return useMutation({
    mutationFn: (id: string) => startSession(id),
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interview-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["interview-statistics"] });
    },
  });
}
