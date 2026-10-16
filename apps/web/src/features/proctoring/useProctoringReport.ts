import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

import {
  getProctoringReport,
  getProctoringTimeline,
  updateProctoringEventStatus,
} from "./api";
import type { ProctoringEventReviewStatus, ProctoringReport } from "./reportTypes";

export function useProctoringReport(interviewSessionId: string) {
  return useQuery<ProctoringReport | null>({
    queryKey: ["proctoring-report", interviewSessionId],
    queryFn: async () => {
      try {
        return await getProctoringReport(interviewSessionId);
      } catch (error) {
        // Not every interview has proctoring enabled/started - that's
        // a normal "no data" case, not a failure to surface.
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: Boolean(interviewSessionId),
  });
}

/**
 * Only needed if you want the evidence timeline without the rest of
 * the report (e.g. a standalone timeline view) - `useProctoringReport`
 * already includes the same list under `report.timeline`.
 */
export function useProctoringTimeline(interviewSessionId: string) {
  return useQuery({
    queryKey: ["proctoring-timeline", interviewSessionId],
    queryFn: () => getProctoringTimeline(interviewSessionId),
    enabled: Boolean(interviewSessionId),
  });
}

/** Recruiter review workflow - acknowledge or dismiss one event. */
export function useUpdateProctoringEventStatus(interviewSessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      eventId,
      status,
    }: {
      eventId: string;
      status: Extract<ProctoringEventReviewStatus, "ACKNOWLEDGED" | "DISMISSED">;
    }) => updateProctoringEventStatus(interviewSessionId, eventId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["proctoring-report", interviewSessionId],
      });
      queryClient.invalidateQueries({
        queryKey: ["proctoring-timeline", interviewSessionId],
      });
    },
  });
}
