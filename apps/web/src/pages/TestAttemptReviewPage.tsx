import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, CircleSlash, XCircle } from "lucide-react";

import { AppLayout } from "../layouts/AppLayout";
import { useAuthStore } from "../features/auth/store";
import {
  OPTION_LETTERS,
  SUBMIT_REASON_LABELS,
  TEST_AUTHOR_ROLES,
  formatDateTime,
  useAttemptReview,
} from "../features/mcq-test";
import {
  ProctoringReportCard,
  useProctoringReport,
  useUpdateProctoringEventStatus,
} from "../features/proctoring";
import { cn } from "../lib/cn";
import { getApiErrorMessage } from "../lib/apiClient";

export default function TestAttemptReviewPage() {
  const { id = "", attemptId = "" } = useParams<{ id: string; attemptId: string }>();
  const user = useAuthStore((state) => state.user);
  const isAuthor = Boolean(user && TEST_AUTHOR_ROLES.includes(user.role));

  const review = useAttemptReview(isAuthor ? id : "", attemptId);
  const proctoringReport = useProctoringReport(isAuthor ? attemptId : "");
  const updateEvent = useUpdateProctoringEventStatus(attemptId);

  if (!isAuthor) {
    return (
      <AppLayout>
        <p className="mt-6 rounded-xl border border-dashed border-line px-4 py-10 text-center text-sm text-ink-soft">
          Test results are available to recruiters, faculty and admins.
        </p>
      </AppLayout>
    );
  }

  const data = review.data;

  return (
    <AppLayout>
      <Link
        to={`/app/tests/${id}/results`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> All results
      </Link>

      {review.isLoading && <p className="mt-6 text-sm text-ink-soft">Loading attempt...</p>}
      {review.isError && (
        <p className="mt-6 rounded-lg bg-danger/5 px-3.5 py-2.5 text-sm text-danger">
          {getApiErrorMessage(review.error)}
        </p>
      )}

      {data && (
        <div className="mt-4 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-line bg-panel p-5">
            <div>
              <p className="text-xs text-ink-soft">{data.testTitle}</p>
              <h1 className="font-display text-2xl font-semibold text-ink">{data.candidate.name}</h1>
              <p className="mt-1 text-sm text-ink-soft">
                {data.candidate.email && `${data.candidate.email} · `}
                Started {formatDateTime(data.startedAt)}
                {data.submittedAt && ` · submitted ${formatDateTime(data.submittedAt)}`}
                {data.submitReason && ` · ${SUBMIT_REASON_LABELS[data.submitReason]}`}
              </p>
            </div>
            {data.result && (
              <div className="text-right">
                <p
                  className={cn(
                    "font-display text-3xl font-bold",
                    data.result.passed ? "text-live" : "text-danger"
                  )}
                >
                  {data.result.percentage}%
                </p>
                <p className="text-xs text-ink-soft">
                  {data.result.score}/{data.result.maxScore} points ·{" "}
                  {data.result.passed ? "passed" : "not passed"} (pass at {data.passPercentage}%)
                </p>
              </div>
            )}
          </div>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">Proctoring</h2>
            <div className="mt-3">
              {proctoringReport.isLoading && (
                <p className="text-sm text-ink-soft">Loading proctoring report...</p>
              )}
              {proctoringReport.isSuccess && !proctoringReport.data && (
                <p className="text-sm text-ink-soft">
                  No proctoring data for this attempt - the candidate's camera session never
                  connected.
                </p>
              )}
              {proctoringReport.data && (
                <ProctoringReportCard
                  report={proctoringReport.data}
                  canReview
                  onAcknowledgeEvent={(eventId) =>
                    updateEvent.mutate({ eventId, status: "ACKNOWLEDGED" })
                  }
                  onDismissEvent={(eventId) => updateEvent.mutate({ eventId, status: "DISMISSED" })}
                />
              )}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-ink">
              Answers{" "}
              <span className="text-sm font-normal text-ink-soft">
                (questions in the order this candidate saw them)
              </span>
            </h2>

            {data.questions.map((question) => {
              const unanswered = question.selectedOptionIndex === null;

              return (
                <div key={question.questionId} className="rounded-xl border border-line bg-panel p-4">
                  <div className="flex items-start gap-2">
                    {unanswered ? (
                      <CircleSlash className="mt-0.5 h-4 w-4 shrink-0 text-ink-soft" />
                    ) : question.isCorrect ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-live" />
                    ) : (
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                    )}
                    <p className="flex-1 whitespace-pre-wrap text-sm font-medium text-ink">
                      {question.number}. {question.text}
                    </p>
                    <span className="text-xs text-ink-soft">
                      {question.isCorrect ? question.points : 0}/{question.points}
                    </span>
                  </div>

                  <ul className="mt-3 space-y-1.5 pl-6">
                    {question.options.map((option, index) => {
                      const isKey = index === question.correctOptionIndex;
                      const isChoice = index === question.selectedOptionIndex;

                      return (
                        <li
                          key={index}
                          className={cn(
                            "rounded-lg border px-3 py-1.5 text-sm",
                            isKey
                              ? "border-live/40 bg-live/5 text-ink"
                              : isChoice
                                ? "border-danger/40 bg-danger/5 text-ink"
                                : "border-line text-ink-soft"
                          )}
                        >
                          <span className="mr-2 font-mono text-xs">{OPTION_LETTERS[index]}.</span>
                          {option}
                          {isKey && <span className="ml-2 text-xs text-live">correct</span>}
                          {isChoice && (
                            <span className="ml-2 text-xs font-semibold text-ink-soft">
                              ← candidate's answer
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>

                  {unanswered && <p className="mt-2 pl-6 text-xs text-ink-soft">Not answered.</p>}
                  {question.explanation && (
                    <p className="mt-2 pl-6 text-xs text-ink-soft">
                      <span className="font-semibold">Why:</span> {question.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </section>
        </div>
      )}
    </AppLayout>
  );
}
