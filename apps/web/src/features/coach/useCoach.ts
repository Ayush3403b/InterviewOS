import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { generateCoachingPlan, getCoachingPlan } from "./api";

export function useCoachingPlan(sessionId: string) {
  return useQuery({
    queryKey: ["coaching-plan", sessionId],
    queryFn: () => getCoachingPlan(sessionId),
    enabled: Boolean(sessionId),
  });
}

export function useGenerateCoachingPlan(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => generateCoachingPlan(sessionId),
    onSuccess: (plan) => {
      queryClient.setQueryData(["coaching-plan", sessionId], plan);
    },
  });
}
