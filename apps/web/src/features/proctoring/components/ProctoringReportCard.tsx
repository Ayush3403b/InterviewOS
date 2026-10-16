import { AlertTriangle, CheckCircle2, ShieldCheck, UserCheck, Video, Mic, Globe, Shield } from "lucide-react";

import type {
  ProctoringEventReviewStatus,
  ProctoringEventSeverity,
  ProctoringEventSummary,
  ProctoringReport,
  RiskLevel,
} from "../reportTypes";

const SEVERITY_STYLES: Record<ProctoringEventSeverity, string> = {
  INFO: "bg-line/60 text-ink-soft",
  LOW: "bg-line/60 text-ink-soft",
  MEDIUM: "bg-warn/10 text-warn",
  HIGH: "bg-warn/10 text-warn",
  CRITICAL: "bg-danger/10 text-danger",
};

const RISK_LEVEL_STYLES: Record<RiskLevel, string> = {
  low: "text-live",
  medium: "text-warn",
  high: "text-warn",
  critical: "text-danger",
};

const STATUS_ROW_STYLES: Record<ProctoringEventReviewStatus, string> = {
  DETECTED: "border-line",
  ACKNOWLEDGED: "border-line",
  DISMISSED: "border-line opacity-50",
};

function formatFlagType(type: string): string {
  return type
    .toLowerCase()
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

interface TimelineRowProps {
  event: ProctoringEventSummary;
  canReview: boolean;
  onAcknowledge?: (eventId: string) => void;
  onDismiss?: (eventId: string) => void;
}

function TimelineRow({ event, canReview, onAcknowledge, onDismiss }: TimelineRowProps) {
  return (
    <div
      className={`flex items-start gap-2.5 border-l-2 py-1.5 pl-3 text-xs ${STATUS_ROW_STYLES[event.status]}`}
    >
      {event.cameraFrame && (
        <img
          src={event.cameraFrame}
          alt=""
          className="h-10 w-14 shrink-0 rounded object-cover border border-line"
        />
      )}

      <span className="mt-0.5 shrink-0 font-mono text-ink-soft/70">
        {formatTime(event.occurredAt)}
      </span>
      <span
        className={`shrink-0 rounded px-1.5 py-0.5 font-medium ${SEVERITY_STYLES[event.severity]}`}
      >
        {event.severity}
      </span>

      <span className="min-w-0 flex-1 text-ink-soft">
        {event.message}
        {event.durationMs != null && (
          <span className="text-ink-soft/60"> ({Math.round(event.durationMs / 1000)}s)</span>
        )}
      </span>

      {event.confidence != null && (
        <span className="shrink-0 font-mono text-[10px] text-ink-soft/70">
          {Math.round(event.confidence * 100)}% conf
        </span>
      )}

      {canReview && event.status === "DETECTED" && (
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => onAcknowledge?.(event.id)}
            className="rounded border border-line px-1.5 py-0.5 text-ink-soft hover:bg-surface"
          >
            Ack
          </button>
          <button
            type="button"
            onClick={() => onDismiss?.(event.id)}
            className="rounded border border-line px-1.5 py-0.5 text-ink-soft hover:bg-surface"
          >
            Dismiss
          </button>
        </div>
      )}

      {event.status !== "DETECTED" && (
        <span className="shrink-0 text-ink-soft/60">{event.status.toLowerCase()}</span>
      )}
    </div>
  );
}

export interface ProctoringReportCardProps {
  report: ProctoringReport;
  /** Only recruiters/org staff get review controls - pass this in
   *  based on the viewer's role; the backend enforces it either way. */
  canReview?: boolean;
  onAcknowledgeEvent?: (eventId: string) => void;
  onDismissEvent?: (eventId: string) => void;
}

export function ProctoringReportCard({
  report,
  canReview = false,
  onAcknowledgeEvent,
  onDismissEvent,
}: ProctoringReportCardProps) {
  const { session, severityBreakdown, timeline, riskScore, riskLevel, violationCount, summary, recommendation } =
    report;

  const violationEntries = Object.entries(session.violationCounts).filter(
    ([, count]) => count > 0
  );

  const hasFaceViolations = (session.violationCounts["NO_FACE_DETECTED"] || 0) > 0 || (session.violationCounts["MULTIPLE_FACES_DETECTED"] || 0) > 0;
  const hasAudioViolations = (session.violationCounts["MULTIPLE_VOICES_DETECTED"] || 0) > 0;
  const hasBrowserViolations = (session.violationCounts["TAB_SWITCHED"] || 0) > 0 || (session.violationCounts["FULLSCREEN_EXITED"] || 0) > 0;
  const hasIdentityViolations = (session.violationCounts["IDENTITY_MISMATCH"] || 0) > 0;

  return (
    <div className="rounded-xl border border-line bg-panel p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {riskLevel === "low" ? (
              <ShieldCheck className="h-5 w-5 text-live" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-warn" />
            )}
            <h2 className="text-base font-semibold text-ink">Proctoring Integrity Report</h2>
          </div>
          {session.candidateName && (
            <p className="mt-1 text-sm font-medium text-ink">
              {session.candidateName}{" "}
              {session.candidateEmail && (
                <span className="text-xs font-normal text-ink-soft">({session.candidateEmail})</span>
              )}
            </p>
          )}
        </div>

        <div className="text-right">
          <span className={`font-display text-2xl font-bold ${RISK_LEVEL_STYLES[riskLevel]}`}>
            {riskScore}
            <span className="text-xs text-ink-soft font-normal">/100 risk</span>
          </span>
          <p className="text-xs text-ink-soft mt-0.5">
            Trust score: <span className="font-semibold text-ink">{session.trustScore}/100</span>
          </p>
        </div>
      </div>

      {/* Compliance & Identity Badges */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-line text-xs">
        {session.consentGivenAt ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-live/10 px-2 py-1 text-live font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Candidate Consent Verified (v{session.consentVersion || "1.0"})
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-md bg-line px-2 py-1 text-ink-soft font-medium">
            Consent not recorded
          </span>
        )}

        {session.referenceFrame ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-signal/10 px-2 py-1 text-signal font-medium">
            <UserCheck className="h-3.5 w-3.5" />
            Baseline Identity Enrolled
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-md bg-line px-2 py-1 text-ink-soft">
            No baseline photo
          </span>
        )}
      </div>

      {/* Signal Health Status Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        <div className={`rounded-lg border p-2.5 ${hasFaceViolations || hasIdentityViolations ? "border-warn/40 bg-warn/5" : "border-line bg-surface/50"}`}>
          <div className="flex items-center gap-1.5 text-xs font-medium text-ink">
            <Video className="h-3.5 w-3.5 text-ink-soft" />
            <span>Face Tracking</span>
          </div>
          <p className={`text-[11px] mt-1 ${hasFaceViolations || hasIdentityViolations ? "text-warn font-medium" : "text-live"}`}>
            {hasIdentityViolations ? "Identity Mismatch" : hasFaceViolations ? "Anomalies Recorded" : "Verified Normal"}
          </p>
        </div>

        <div className={`rounded-lg border p-2.5 ${hasAudioViolations ? "border-warn/40 bg-warn/5" : "border-line bg-surface/50"}`}>
          <div className="flex items-center gap-1.5 text-xs font-medium text-ink">
            <Mic className="h-3.5 w-3.5 text-ink-soft" />
            <span>Audio Stream</span>
          </div>
          <p className={`text-[11px] mt-1 ${hasAudioViolations ? "text-warn font-medium" : "text-live"}`}>
            {hasAudioViolations ? "Voices Detected" : "Single Speaker"}
          </p>
        </div>

        <div className={`rounded-lg border p-2.5 ${hasBrowserViolations ? "border-warn/40 bg-warn/5" : "border-line bg-surface/50"}`}>
          <div className="flex items-center gap-1.5 text-xs font-medium text-ink">
            <Globe className="h-3.5 w-3.5 text-ink-soft" />
            <span>Browser Focus</span>
          </div>
          <p className={`text-[11px] mt-1 ${hasBrowserViolations ? "text-warn font-medium" : "text-live"}`}>
            {hasBrowserViolations ? "Tab Exits Logged" : "Continuous Focus"}
          </p>
        </div>

        <div className="rounded-lg border border-line bg-surface/50 p-2.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-ink">
            <Shield className="h-3.5 w-3.5 text-ink-soft" />
            <span>Integrity Status</span>
          </div>
          <p className="text-[11px] mt-1 text-ink font-medium capitalize">
            {session.status.toLowerCase()}
          </p>
        </div>
      </div>

      <p className="text-xs text-ink-soft">
        {violationCount} violation(s) · {session.totalSignals} telemetry signals · agent: {session.agentProvider}
      </p>

      <p className="text-sm text-ink">{summary}</p>
      <p className="rounded-lg bg-surface px-3 py-2 text-xs font-medium text-ink-soft">
        {recommendation}
      </p>

      {violationEntries.length > 0 ? (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">
            Violations Breakdown
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {violationEntries.map(([type, count]) => (
              <span
                key={type}
                className="rounded-full bg-line/60 px-2.5 py-1 text-xs font-medium text-ink-soft"
              >
                {formatFlagType(type)} · {count}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-ink-soft">
          No violations recorded during this interview.
        </p>
      )}

      {Object.keys(severityBreakdown).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(severityBreakdown).map(([severity, count]) => (
            <span
              key={severity}
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${SEVERITY_STYLES[severity as ProctoringEventSeverity] ?? SEVERITY_STYLES.INFO}`}
            >
              {severity} · {count}
            </span>
          ))}
        </div>
      )}

      {timeline.length > 0 && (
        <div className="pt-2 border-t border-line">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">
            Evidence timeline ({timeline.length})
          </p>
          <div className="mt-2 max-h-96 space-y-1 overflow-y-auto pr-1">
            {timeline.map((event) => (
              <TimelineRow
                key={event.id}
                event={event}
                canReview={canReview}
                onAcknowledge={onAcknowledgeEvent}
                onDismiss={onDismissEvent}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
