import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  compareResumeVersions,
  getMyLatestResume,
  getResumeVersions,
  uploadResume,
} from "./api";

export function useMyLatestResume() {
  return useQuery({
    queryKey: ["resume", "me"],
    queryFn: getMyLatestResume,
  });
}

export function useUploadResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      interviewSessionId,
    }: {
      file: File;
      interviewSessionId?: string;
    }) => uploadResume(file, interviewSessionId),
    onSuccess: () => {
      // A new upload = a new version, so both the "latest" view and
      // the version history list need to reflect it.
      queryClient.invalidateQueries({ queryKey: ["resume"] });
    },
  });
}

export function useResumeVersions(page = 1, limit = 20) {
  return useQuery({
    queryKey: ["resume", "versions", page, limit],
    queryFn: () => getResumeVersions(page, limit),
    placeholderData: (previous) => previous,
  });
}

export function useCompareResumeVersions(fromId?: string, toId?: string) {
  return useQuery({
    queryKey: ["resume", "compare", fromId, toId],
    queryFn: () => compareResumeVersions(fromId!, toId!),
    enabled: Boolean(fromId && toId && fromId !== toId),
  });
}
