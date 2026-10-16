import { Link } from "react-router-dom";
import { AlertTriangle, ShieldAlert } from "lucide-react";

import { AppLayout } from "../layouts/AppLayout";
import { useAuthStore } from "../features/auth/store";
import { useFlaggedSessions } from "../features/proctoring";
import type { RiskLevel } from "../features/proctoring";
import { getApiErrorMessage } from "../lib/apiClient";

const ELEVATED_ROLES = ["recruiter", "faculty", "admin", "super_admin"];

const RISK_STYLES: Record<RiskLevel, string> = {
  low: "bg-live/10 text-live",
  medium: "bg-warn/10 text-warn",
  high: "bg-warn/10 text-warn",
  critical: "bg-danger/10 text-danger",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FlaggedSessionsPage() {
  const user = useAuthStore((state) => state.user);
  const isAuthorized = Boolean(user && ELEVATED_ROLES.includes(user.role));

  const flaggedSessions = useFlaggedSessions();

  if (!isAuthorized) {
    return (
      <AppLayout>
        <div className="mt-6 rounded-xl border border-dashed border-line px-4 py-10 text-center">
          <p className="text-sm text-ink-soft">
            This view is only available to recruiters, faculty, and admins.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-warn" />
        <h1 className="font-display text-2xl font-semibold text-ink">
          Flagged interviews
        </h1>
      </div>
      <p className="mt-1 text-sm text-ink-soft">
        Interviews where proctoring detected enough risk to warrant a
        manual look.
      </p>

      <div className="mt-6">
        {flaggedSessions.isLoading && (
          <p className="text-sm text-ink-soft">Loading flagged sessions...</p>
        )}

        {flaggedSessions.isError && (
          <p className="rounded-lg bg-danger/5 px-3.5 py-2.5 text-sm text-danger">
            {getApiErrorMessage(flaggedSessions.error)}
          </p>
        )}

        {flaggedSessions.isSuccess && flaggedSessions.data.length === 0 && (
          <div className="rounded-xl border border-dashed border-line px-4 py-10 text-center">
            <p className="text-sm text-ink-soft">
              No flagged interviews right now.
            </p>
          </div>
        )}

        {flaggedSessions.isSuccess && flaggedSessions.data.length > 0 && (
          <div className="space-y-2.5">
            {flaggedSessions.data.map((session) => {
              const violationTotal = Object.values(
                session.violationCounts
              ).reduce((sum, count) => sum + count, 0);

              return (
                <Link
                  key={session.id}
                  to={`/app/proctoring/sessions/${session.interviewSessionId}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-line bg-panel px-4 py-3.5 transition hover:border-signal/40"
                >
                  <div className="min-w-0 flex items-center gap-3">
                    {session.candidateAvatar ? (
                      <img
                        src={session.candidateAvatar}
                        alt=""
                        className="h-9 w-9 rounded-full object-cover border border-line"
                      />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-signal/10 font-semibold text-xs text-signal">
                        {(session.candidateName || "C")[0].toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 truncate text-sm font-medium text-ink">
                        <AlertTriangle className="h-3.5 w-3.5 text-warn shrink-0" />
                        <span className="truncate">{session.candidateName || `Candidate ${session.candidateId.slice(-6)}`}</span>
                        {session.candidateEmail && (
                          <span className="text-xs font-normal text-ink-soft/70 truncate">
                            ({session.candidateEmail})
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-soft">
                        {violationTotal} violation{violationTotal === 1 ? "" : "s"}{" "}
                        · {session.totalSignals} signals ·{" "}
                        {session.flaggedAt
                          ? formatDate(session.flaggedAt)
                          : formatDate(session.startedAt)}
                        {session.consentGivenAt && " · Consent on file"}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-mono text-sm text-ink">
                      Trust {session.trustScore}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium uppercase ${RISK_STYLES[session.riskLevel]}`}
                    >
                      {session.riskLevel}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
