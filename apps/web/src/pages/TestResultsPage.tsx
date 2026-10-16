import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ShieldAlert } from "lucide-react";

import { AppLayout } from "../layouts/AppLayout";
import { useAuthStore } from "../features/auth/store";
import {
  SUBMIT_REASON_LABELS,
  TEST_AUTHOR_ROLES,
  TestStatusBadge,
  formatDateTime,
  useTestResults,
  type McqResultRow,
} from "../features/mcq-test";
import type { RiskLevel } from "../features/proctoring";
import { getApiErrorMessage } from "../lib/apiClient";

const RISK_STYLES: Record<RiskLevel, string> = {
  low: "bg-live/10 text-live",
  medium: "bg-warn/10 text-warn",
  high: "bg-warn/10 text-warn",
  critical: "bg-danger/10 text-danger",
};

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-panel px-4 py-3">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className="mt-0.5 font-display text-xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function summarize(rows: McqResultRow[]) {
  const scored = rows.filter((row) => row.result);
  const average = scored.length
    ? scored.reduce((sum, row) => sum + (row.result?.percentage ?? 0), 0) / scored.length
    : null;
  const passed = scored.filter((row) => row.result?.passed).length;
  const flagged = rows.filter((row) => row.proctoring?.status === "FLAGGED").length;

  return { submitted: scored.length, average, passed, flagged };
}

export default function TestResultsPage() {
  const { id = "" } = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const isAuthor = Boolean(user && TEST_AUTHOR_ROLES.includes(user.role));

  const results = useTestResults(isAuthor ? id : "");

  if (!isAuthor) {
    return (
      <AppLayout>
        <p className="mt-6 rounded-xl border border-dashed border-line px-4 py-10 text-center text-sm text-ink-soft">
          Test results are available to recruiters, faculty and admins.
        </p>
      </AppLayout>
    );
  }

  const stats = results.data ? summarize(results.data.attempts) : null;

  return (
    <AppLayout>
      <Link
        to={`/app/tests/${id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Back to test
      </Link>

      {results.isLoading && <p className="mt-6 text-sm text-ink-soft">Loading results...</p>}
      {results.isError && (
        <p className="mt-6 rounded-lg bg-danger/5 px-3.5 py-2.5 text-sm text-danger">
          {getApiErrorMessage(results.error)}
        </p>
      )}

      {results.data && stats && (
        <div className="mt-4 space-y-5">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-semibold text-ink">
              {results.data.test.title} - results
            </h1>
            <TestStatusBadge status={results.data.test.status} />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Submitted" value={`${stats.submitted} / ${results.data.attempts.length}`} />
            <StatTile
              label="Average score"
              value={stats.average === null ? "-" : `${stats.average.toFixed(1)}%`}
            />
            <StatTile
              label={`Passed (≥ ${results.data.test.passPercentage}%)`}
              value={String(stats.passed)}
            />
            <StatTile label="Flagged by proctoring" value={String(stats.flagged)} />
          </div>

          {results.data.attempts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-sm text-ink-soft">
              Nobody has taken this test yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-line bg-panel">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line bg-surface/60 text-xs text-ink-soft">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Candidate</th>
                    <th className="px-4 py-2.5 font-medium">Score</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5 font-medium">Proctoring</th>
                    <th className="px-4 py-2.5 font-medium">Submitted</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {results.data.attempts.map((row) => (
                    <tr key={row.id} className="border-b border-line last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">{row.candidate.name}</p>
                        {row.candidate.email && (
                          <p className="text-xs text-ink-soft">{row.candidate.email}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {row.result ? (
                          <span
                            className={`font-semibold ${row.result.passed ? "text-live" : "text-danger"}`}
                          >
                            {row.result.percentage}%
                            <span className="ml-1 text-xs font-normal text-ink-soft">
                              ({row.result.score}/{row.result.maxScore})
                            </span>
                          </span>
                        ) : (
                          <span className="text-ink-soft">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-soft">
                        {row.status === "IN_PROGRESS"
                          ? "In progress"
                          : row.submitReason
                            ? SUBMIT_REASON_LABELS[row.submitReason]
                            : "Submitted"}
                      </td>
                      <td className="px-4 py-3">
                        {row.proctoring ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium uppercase ${RISK_STYLES[row.proctoring.riskLevel]}`}
                            >
                              {row.proctoring.riskLevel}
                            </span>
                            {row.proctoring.status === "FLAGGED" && (
                              <ShieldAlert className="h-4 w-4 text-warn" aria-label="Flagged" />
                            )}
                          </span>
                        ) : (
                          <span className="text-xs text-ink-soft">No data</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-soft">
                        {row.submittedAt ? formatDateTime(row.submittedAt) : "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/app/tests/${id}/results/${row.id}`}
                          className="text-xs font-semibold text-signal hover:underline"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
