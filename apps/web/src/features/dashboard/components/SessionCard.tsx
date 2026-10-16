import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Loader2, Trash2 } from "lucide-react";

import type { InterviewSessionSummary, InterviewStatus } from "../types";
import { INTERVIEW_LEVEL_LABELS, INTERVIEW_TYPE_LABELS } from "../schemas";
import { useDeleteSession } from "../useDashboard";

const STATUS_STYLES: Record<InterviewStatus, string> = {
  CREATED: "bg-line/60 text-ink-soft",
  IN_PROGRESS: "bg-signal/10 text-signal",
  PAUSED: "bg-warn/10 text-warn",
  COMPLETED: "bg-live/10 text-live",
  CANCELLED: "bg-danger/10 text-danger",
  EXPIRED: "bg-line/60 text-ink-soft",
};

const STATUS_LABELS: Record<InterviewStatus, string> = {
  CREATED: "Not started",
  IN_PROGRESS: "In progress",
  PAUSED: "Paused",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "—";
  const minutes = Math.round(seconds / 60);
  return minutes < 1 ? `${seconds}s` : `${minutes}m`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function SessionCard({ session }: { session: InterviewSessionSummary }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteMutation = useDeleteSession();

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    deleteMutation.mutate(session.id);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmDelete(false);
  };

  return (
    <Link
      to={`/app/interviews/${session.id}`}
      className="group flex items-center justify-between gap-4 rounded-xl border border-line bg-panel px-4 py-3.5 transition hover:border-signal/40 hover:shadow-sm"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink group-hover:text-signal transition">
          {session.title}
        </p>
        <p className="mt-0.5 text-xs text-ink-soft">
          {INTERVIEW_TYPE_LABELS[session.type]} ·{" "}
          {INTERVIEW_LEVEL_LABELS[session.level]} ·{" "}
          {formatDate(session.createdAt)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {session.status === "COMPLETED" && (
          <span className="font-mono text-sm font-bold text-ink">
            {session.score}/100
          </span>
        )}

        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[session.status]}`}
        >
          {STATUS_LABELS[session.status]}
        </span>

        <span className="text-xs text-ink-soft/70">
          {formatDuration(session.duration)}
        </span>

        {/* Delete action button / confirmation */}
        {confirmDelete ? (
          <div
            className="flex items-center gap-1.5 rounded-lg border border-danger/30 bg-danger/5 px-2 py-1"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <span className="text-xs font-semibold text-danger">Delete?</span>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="rounded bg-danger px-2 py-0.5 text-xs font-bold text-white shadow-sm hover:bg-danger/90 transition disabled:opacity-50"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                "Yes"
              )}
            </button>
            <button
              type="button"
              onClick={handleCancelDelete}
              className="rounded border border-line bg-panel px-1.5 py-0.5 text-xs font-medium text-ink-soft hover:text-ink transition"
            >
              No
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleDelete}
            title="Delete this interview"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-soft/40 transition hover:bg-danger/10 hover:text-danger"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}

        <ChevronRight className="h-4 w-4 text-ink-soft/50 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </Link>
  );
}
