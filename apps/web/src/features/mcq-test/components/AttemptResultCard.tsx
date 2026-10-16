import { Link } from "react-router-dom";
import { CheckCircle2, Clock, ShieldAlert, XCircle } from "lucide-react";

import { cn } from "../../../lib/cn";

import { formatDateTime } from "../labels";
import type { McqCandidateAttempt } from "../types";

/** What a candidate sees once their attempt is submitted. */
export function AttemptResultCard({ attempt }: { attempt: McqCandidateAttempt }) {
  const { result } = attempt;

  return (
    <div className="mx-auto mt-8 w-full max-w-lg rounded-2xl border border-line bg-panel p-8 text-center shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
        {attempt.testTitle}
      </p>
      <h1 className="mt-2 font-display text-2xl font-bold text-ink">Test submitted</h1>
      {attempt.submittedAt && (
        <p className="mt-1 text-sm text-ink-soft">{formatDateTime(attempt.submittedAt)}</p>
      )}

      {attempt.submitReason === "TIME_UP" && (
        <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-warn/10 px-3 py-1 text-xs font-medium text-warn">
          <Clock className="h-3.5 w-3.5" /> Time ran out - your saved answers were submitted.
        </p>
      )}
      {attempt.submitReason === "PROCTORING" && (
        <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-danger/10 px-3 py-1 text-xs font-medium text-danger">
          <ShieldAlert className="h-3.5 w-3.5" /> Auto-submitted after leaving fullscreen too
          many times.
        </p>
      )}

      {result ? (
        <div className="mt-6">
          <div
            className={cn(
              "mx-auto flex h-28 w-28 flex-col items-center justify-center rounded-full border-4",
              result.passed ? "border-live text-live" : "border-danger text-danger"
            )}
          >
            <span className="font-display text-3xl font-bold">{result.percentage}%</span>
          </div>
          <p
            className={cn(
              "mt-3 inline-flex items-center gap-1.5 text-sm font-semibold",
              result.passed ? "text-live" : "text-danger"
            )}
          >
            {result.passed ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            {result.passed ? "Passed" : "Not passed"}
          </p>
          <p className="mt-2 text-sm text-ink-soft">
            {result.score} / {result.maxScore} points · {result.correctCount} correct ·{" "}
            {result.answeredCount} of {attempt.questionCount} answered
          </p>
        </div>
      ) : (
        <p className="mt-6 text-sm text-ink-soft">
          Your answers have been recorded. The test organiser will share your results.
        </p>
      )}

      <Link
        to="/app/tests"
        className="mt-8 inline-flex rounded-lg bg-signal px-4 py-2 text-sm font-semibold text-white hover:bg-signal-strong"
      >
        Back to tests
      </Link>
    </div>
  );
}
