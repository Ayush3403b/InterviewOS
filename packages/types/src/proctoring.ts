export type ProctoringEventType =
  | "NO_FACE"
  | "MULTIPLE_FACES"
  | "LOOK_AWAY"
  | "TAB_SWITCH"
  | "WINDOW_BLUR"
  | "FULLSCREEN_EXIT"
  | "AUDIO_ANOMALY"
  | "DEVTOOLS_OPEN";

export type EventSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface ProctoringTimelineEvent {
  id: string;
  type: ProctoringEventType;
  severity: EventSeverity;
  timestamp: string;
  durationMs?: number;
  snapshotUrl?: string;
  details?: string;
}

export interface ProctoringSessionDto {
  id: string;
  interviewSessionId: string;
  candidateId: string;
  overallRiskScore: number; // 0 - 100
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  totalViolations: number;
  events: ProctoringTimelineEvent[];
  isFlagged: boolean;
  recruiterNotes?: string;
  createdAt: string;
  updatedAt: string;
}
