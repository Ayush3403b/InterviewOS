import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

import {
  getProctoringReport,
  getProctoringTimeline,
  updateProctoringEventStatus,
} from "./api";
import type { ProctoringEventReviewStatus, ProctoringReport } from "./reportTypes";

export function useProctoringReport(subjectId: string) {
  return useQuery<ProctoringReport | null>({
    queryKey: ["proctoring-report", subjectId],
    queryFn: async () => {
      try {
        return await getProctoringReport(subjectId);
      } catch (error) {
        // Not every interview/attempt has proctoring started - that's
        // a normal "no data" case, not a failure to surface.
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: Boolean(subjectId),
  });
}

/**
 * Only needed if you want the evidence timeline without the rest of
 * the report (e.g. a standalone timeline view) - `useProctoringReport`
 * already includes the same list under `report.timeline`.
 */
export function useProctoringTimeline(subjectId: string) {
  return useQuery({
    queryKey: ["proctoring-timeline", subjectId],
    queryFn: () => getProctoringTimeline(subjectId),
    enabled: Boolean(subjectId),
  });
}

/** Recruiter review workflow - acknowledge or dismiss one event. */
export function useUpdateProctoringEventStatus(subjectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      eventId,
      status,
    }: {
      eventId: string;
      status: Extract<ProctoringEventReviewStatus, "ACKNOWLEDGED" | "DISMISSED">;
    }) => updateProctoringEventStatus(subjectId, eventId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["proctoring-report", subjectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["proctoring-timeline", subjectId],
      });
    },
  });
}
