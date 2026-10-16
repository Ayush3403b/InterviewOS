import { apiClient } from "../../lib/apiClient";

export interface ScoreTrendPoint {
  _id: string;
  title: string;
  type: string;
  level: string;
  score: number;
  duration: number;
  completedAt?: string;
  createdAt: string;
}

export interface InterviewStatistics {
  totalInterviews: number;
  completedInterviews: number;
  averageScore: number;
  totalDuration: number;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function fetchScoreTrends(limit = 20): Promise<ScoreTrendPoint[]> {
  const res = await apiClient.get<ApiEnvelope<ScoreTrendPoint[]>>(
    `/interview-sessions/trends?limit=${limit}`
  );
  return res.data.data;
}

export async function fetchInterviewStatistics(): Promise<InterviewStatistics> {
  const res = await apiClient.get<ApiEnvelope<InterviewStatistics>>(
    `/interview-sessions/statistics`
  );
  return res.data.data;
}
