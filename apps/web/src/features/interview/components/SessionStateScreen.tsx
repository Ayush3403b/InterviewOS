import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, PauseCircle, XCircle, Play, X, ArrowLeft } from "lucide-react";

import { getApiErrorMessage } from "../../../lib/apiClient";
import { dashboardApi } from "../../dashboard";

interface SessionStateScreenProps {
  sessionId: string;
  status: "PAUSED" | "EXPIRED" | "CANCELLED";
  /** Called after a successful resume/cancel so the parent can refetch. */
  onAction?: () => void;
}

/**
 * Full-panel informational screen for terminal or blocked interview states.
 *
 * Handles three cases:
 *  - PAUSED   — candidate (or system) paused mid-interview; can resume or cancel.
 *  - EXPIRED  — session went stale (no activity) and auto-expired; informational only.
 *  - CANCELLED — session was explicitly cancelled; informational only.
 */
export function SessionStateScreen({
  sessionId,
  status,
  onAction,
}: SessionStateScreenProps) {
  const navigate = useNavigate();
  const [resuming, setResuming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResume = async () => {
    setResuming(true);
    setError(null);
    try {
      await dashboardApi.resumeSession(sessionId);
      onAction?.();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setResuming(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    setError(null);
    try {
      await dashboardApi.cancelSession(sessionId);
      onAction?.();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  const config = {
    PAUSED: {
      Icon: PauseCircle,
      iconClass: "text-amber-500",
      bgClass: "bg-amber-50 border-amber-200",
      heading: "Interview paused",
      body: "Your interview is paused. You can resume where you left off, or cancel it entirely.",
    },
    EXPIRED: {
      Icon: Clock,
      iconClass: "text-slate-400",
      bgClass: "bg-slate-50 border-slate-200",
      heading: "Interview expired",
      body: "This session expired due to inactivity. Your progress has been saved but you cannot continue this interview.",
    },
    CANCELLED: {
      Icon: XCircle,
      iconClass: "text-danger",
      bgClass: "bg-danger/5 border-danger/20",
      heading: "Interview cancelled",
      body: "This interview was cancelled and is no longer active.",
    },
  }[status];

  const { Icon, iconClass, bgClass, heading, body } = config;

  return (
    <div
      className={`mt-6 rounded-xl border p-8 text-center ${bgClass}`}
      data-testid={`session-state-${status.toLowerCase()}`}
    >
      <div className="flex justify-center">
        <Icon className={`h-12 w-12 ${iconClass}`} />
      </div>

      <h2 className="mt-4 font-display text-xl font-semibold text-ink">
        {heading}
      </h2>

      <p className="mt-2 text-sm text-ink-soft">{body}</p>

      {error && (
        <p className="mt-4 rounded-lg bg-danger/5 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {status === "PAUSED" && (
        <div className="mt-6 flex justify-center gap-3">
          <button
            id="resume-interview-btn"
            onClick={() => void handleResume()}
            disabled={resuming || cancelling}
            className="flex items-center gap-2 rounded-lg bg-signal px-5 py-2.5 text-sm font-medium text-white transition hover:bg-signal-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resuming ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {resuming ? "Resuming..." : "Resume interview"}
          </button>

          <button
            id="cancel-interview-btn"
            onClick={() => void handleCancel()}
            disabled={resuming || cancelling}
            className="flex items-center gap-2 rounded-lg border border-line px-5 py-2.5 text-sm font-medium text-ink transition hover:border-danger/40 hover:text-danger disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelling ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-line border-t-ink" />
            ) : (
              <X className="h-4 w-4" />
            )}
            {cancelling ? "Cancelling..." : "Cancel interview"}
          </button>
        </div>
      )}

      {(status === "EXPIRED" || status === "CANCELLED") && (
        <button
          id="back-to-dashboard-btn"
          onClick={() => navigate("/app")}
          className="mx-auto mt-6 flex items-center gap-1.5 text-sm font-medium text-ink-soft transition hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </button>
      )}
    </div>
  );
}
