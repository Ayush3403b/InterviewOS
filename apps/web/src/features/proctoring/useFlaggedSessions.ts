import { useQuery } from "@tanstack/react-query";

import { getFlaggedSessions } from "./api";

export function useFlaggedSessions(organizationId?: string) {
  return useQuery({
    queryKey: ["proctoring-flagged-sessions", organizationId ?? "all"],
    queryFn: () => getFlaggedSessions(organizationId),
  });
}
