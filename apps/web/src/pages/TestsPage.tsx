import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BarChart3, ClipboardList, KeyRound, Pencil, Plus } from "lucide-react";

import { AppLayout } from "../layouts/AppLayout";
import { useAuthStore } from "../features/auth/store";
import {
  CreateTestModal,
  TEST_AUTHOR_ROLES,
  TestStatusBadge,
  formatDateTime,
  useMyAttempts,
  useMyTests,
} from "../features/mcq-test";
import { getApiErrorMessage } from "../lib/apiClient";

function JoinTestCard() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const normalized = code.trim().toUpperCase().replace(/[\s-]/g, "");

  return (
    <section className="rounded-2xl border border-line bg-panel p-5">
      <div className="flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-signal" />
        <h2 className="font-display text-base font-semibold text-ink">Take a test</h2>
      </div>
      <p className="mt-1 text-sm text-ink-soft">Enter the code you were given.</p>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (normalized) navigate(`/app/take/${normalized}`);
        }}
      >
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="e.g. K7Q2M9XA"
          maxLength={20}
          className="w-48 rounded-lg border border-line bg-panel px-3 py-2 font-mono text-sm uppercase tracking-widest outline-none focus:border-signal"
        />
        <button
          type="submit"
          disabled={!normalized}
          className="rounded-lg bg-signal px-4 py-2 text-sm font-semibold text-white hover:bg-signal-strong disabled:opacity-50"
        >
          Open
        </button>
      </form>
    </section>
  );
}

function MyAttempts() {
  const attempts = useMyAttempts();

  if (!attempts.data?.length) {
    return null;
  }

  return (
    <section>
      <h2 className="font-display text-lg font-semibold text-ink">Your attempts</h2>
      <div className="mt-3 space-y-2">
        {attempts.data.map((attempt) => (
          <div
            key={attempt.id}
            className="flex items-center justify-between gap-4 rounded-xl border border-line bg-panel px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{attempt.testTitle}</p>
              <p className="text-xs text-ink-soft">
                {attempt.status === "IN_PROGRESS"
                  ? "In progress - reopen your test link to continue"
                  : `Submitted ${formatDateTime(attempt.submittedAt ?? attempt.startedAt)}`}
              </p>
            </div>
            {attempt.result && (
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  attempt.result.passed ? "bg-live/10 text-live" : "bg-danger/10 text-danger"
                }`}
              >
                {attempt.result.percentage}% · {attempt.result.passed ? "Passed" : "Not passed"}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function MyTests() {
  const navigate = useNavigate();
  const tests = useMyTests();
  const [creating, setCreating] = useState(false);

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">Your tests</h2>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-signal px-3.5 py-2 text-sm font-semibold text-white hover:bg-signal-strong"
        >
          <Plus className="h-4 w-4" /> New test
        </button>
      </div>

      <div className="mt-3 space-y-2">
        {tests.isLoading && <p className="text-sm text-ink-soft">Loading tests...</p>}
        {tests.isError && (
          <p className="rounded-lg bg-danger/5 px-3.5 py-2.5 text-sm text-danger">
            {getApiErrorMessage(tests.error)}
          </p>
        )}
        {tests.isSuccess && tests.data.length === 0 && (
          <div className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-sm text-ink-soft">
            No tests yet. Create one, then add questions from topics, PDFs or photos.
          </div>
        )}
        {tests.data?.map((test) => (
          <div
            key={test.id}
            className="flex items-center justify-between gap-4 rounded-xl border border-line bg-panel px-4 py-3.5"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-ink">{test.title}</p>
                <TestStatusBadge status={test.status} />
              </div>
              <p className="mt-0.5 text-xs text-ink-soft">
                {test.questionCount} question{test.questionCount === 1 ? "" : "s"} ·{" "}
                {test.durationMinutes} min · {test.submittedCount} submitted
                {test.accessCode && (
                  <>
                    {" "}
                    · code <span className="font-mono font-semibold">{test.accessCode}</span>
                  </>
                )}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                to={`/app/tests/${test.id}`}
                className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:border-signal/50"
              >
                <Pencil className="h-3.5 w-3.5" /> {test.status === "DRAFT" ? "Edit" : "View"}
              </Link>
              {test.status !== "DRAFT" && (
                <Link
                  to={`/app/tests/${test.id}/results`}
                  className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:border-signal/50"
                >
                  <BarChart3 className="h-3.5 w-3.5" /> Results
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {creating && (
        <CreateTestModal
          onClose={() => setCreating(false)}
          onCreated={(id) => navigate(`/app/tests/${id}`)}
        />
      )}
    </section>
  );
}

export default function TestsPage() {
  const user = useAuthStore((state) => state.user);
  const isAuthor = Boolean(user && TEST_AUTHOR_ROLES.includes(user.role));

  return (
    <AppLayout>
      <div className="flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-signal" />
        <h1 className="font-display text-2xl font-semibold text-ink">MCQ tests</h1>
      </div>
      <p className="mt-1 text-sm text-ink-soft">
        Timed multiple-choice tests with live camera proctoring.
      </p>

      <div className="mt-6 space-y-8">
        <JoinTestCard />
        {isAuthor && <MyTests />}
        <MyAttempts />
      </div>
    </AppLayout>
  );
}
