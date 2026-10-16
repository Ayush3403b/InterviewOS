import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createReportShareLink,
  downloadReportPdf,
  generateReport,
  getPublicReport,
  getReport,
  revokeReportShareLink,
} from "./api";

export function useReport(sessionId: string) {
  return useQuery({
    queryKey: ["report", sessionId],
    queryFn: () => getReport(sessionId),
    enabled: Boolean(sessionId),
  });
}

export function useGenerateReport(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => generateReport(sessionId),
    onSuccess: (report) => {
      queryClient.setQueryData(["report", sessionId], report);
    },
  });
}

export function useDownloadReportPdf(sessionId: string) {
  return useMutation({
    mutationFn: () => downloadReportPdf(sessionId),
  });
}

export function useShareReport(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expiresInDays?: number) =>
      createReportShareLink(sessionId, expiresInDays),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report", sessionId] });
    },
  });
}

export function useRevokeShareReport(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => revokeReportShareLink(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report", sessionId] });
    },
  });
}

export function usePublicReport(shareToken: string) {
  return useQuery({
    queryKey: ["public-report", shareToken],
    queryFn: () => getPublicReport(shareToken),
    enabled: Boolean(shareToken),
  });
}
