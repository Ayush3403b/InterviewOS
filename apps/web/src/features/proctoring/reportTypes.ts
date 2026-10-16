import type { ProctoredSubjectType } from "./types";

export type ProctoringSessionState =
  | "ACTIVE"
  | "FLAGGED"
  | "COMPLETED"
  | "TERMINATED";

export type ProctoringEventSeverity =
  | "INFO"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type ProctoringEventReviewStatus =
  | "DETECTED"
  | "ACKNOWLEDGED"
  | "DISMISSED";

export type RiskLevel = "low" | "medium" | "high" | "critical";

/** Mirrors ProctoringResponse.toSessionResponse (backend). */
export interface ProctoringSessionSummary {
  id: string;
  subjectType: ProctoredSubjectType;
  /** The interview session / MCQ attempt this session watched. */
  subjectId: string;
  candidateId: string;
  candidateName?: string;
  candidateEmail?: string;
  candidateAvatar?: string;
  organizationId?: string;
  status: ProctoringSessionState;
  trustScore: number;
  /** 0-100, weighted by violation type - see the backend's RiskEngine. */
  riskScore: number;
  /** Derived live from riskScore - see ProctoringResponse.toSessionResponse. */
  riskLevel: RiskLevel;
  totalSignals: number;
  violationCounts: Record<string, number>;
  agentProvider: string;
  consentGivenAt?: string;
  consentVersion?: string;
  referenceFrame?: string;
  startedAt: string;
  lastSignalAt?: string;
  flaggedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors ProctoringResponse.toEventResponse (backend). */
export interface ProctoringEventSummary {
  id: string;
  type: string;
  severity: ProctoringEventSeverity;
  message: string;
  confidence: number;
  status: ProctoringEventReviewStatus;
  /** Base64 data URL - only present on MEDIUM+ severity events. */
  cameraFrame?: string;
  /** ms - only present for events derived from a continuous signal
   *  (gaze-away, idle, eyes-closed). */
  durationMs?: number;
  metadata?: Record<string, unknown>;
  occurredAt: string;
}

/** Mirrors ProctoringResponse.toReport (backend). */
export interface ProctoringReport {
  session: ProctoringSessionSummary;
  riskScore: number;
  riskLevel: RiskLevel;
  violationCount: number;
  severityBreakdown: Record<string, number>;
  /** Deterministic, template-generated text - not an LLM call, see
   *  the backend's ReportSummary.ts for why and how to swap one in. */
  summary: string;
  recommendation: string;
  /** Full chronological event history, oldest first. */
  timeline: ProctoringEventSummary[];
}
