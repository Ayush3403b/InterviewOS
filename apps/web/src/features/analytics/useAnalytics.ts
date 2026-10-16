import { useQuery } from "@tanstack/react-query";
import { fetchScoreTrends, fetchInterviewStatistics } from "./api";

export function useScoreTrends(limit = 20) {
  return useQuery({
    queryKey: ["analytics", "trends", limit],
    queryFn: () => fetchScoreTrends(limit),
  });
}

export function useInterviewStats() {
  return useQuery({
    queryKey: ["analytics", "statistics"],
    queryFn: () => fetchInterviewStatistics(),
  });
}
