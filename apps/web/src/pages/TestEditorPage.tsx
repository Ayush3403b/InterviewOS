import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BarChart3, Lock, Rocket, RotateCcw, Settings2, Trash2 } from "lucide-react";

import { AppLayout } from "../layouts/AppLayout";
import { useAuthStore } from "../features/auth/store";
import {
  MCQ_LIMITS,
  QuestionGenerator,
  QuestionListEditor,
  ShareTestCard,
  TEST_AUTHOR_ROLES,
  TestSettingsForm,
  TestStatusBadge,
  useChangeTestStatus,
  useDeleteTest,
  useTest,
  useUpdateTest,
  type McqTestDetail,
} from "../features/mcq-test";
import { getApiErrorMessage } from "../lib/apiClient";

function SettingsSection({ test }: { test: McqTestDetail }) {
  const [open, setOpen] = useState(test.questionCount === 0);
  const updateTest = useUpdateTest(test.id);
  const editable = test.status === "DRAFT";

  return (
    <section className="rounded-2xl border border-line bg-panel p-5">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-signal" />
          <span className="font-display text-lg font-semibold text-ink">Settings</span>
        </span>
        <span className="text-xs text-ink-soft">
          {test.durationMinutes} min · pass at {test.passPercentage}% ·{" "}
          {test.shuffleQuestions ? "shuffled" : "fixed order"}
          {editable && <span className="ml-2 text-signal">{open ? "Hide" : "Edit"}</span>}
        </span>
      </button>

      {open && editable && (
        <div className="mt-4">
          <TestSettingsForm
            // Remount only when the saved settings change - a question
            // save shouldn't wipe half-edited settings.
            key={[
              test.title,
              test.description,
              test.instructions,
              test.durationMinutes,
              test.passPercentage,
              test.shuffleQuestions,
              test.shuffleOptions,
              test.showScoreToCandidate,
            ].join("|")}
            initialValues={{
              title: test.title,
              description: test.description,
              instructions: test.instructions,
              durationMinutes: test.durationMinutes,
              passPercentage: test.passPercentage,
              shuffleQuestions: test.shuffleQuestions,
              shuffleOptions: test.shuffleOptions,
              showScoreToCandidate: test.showScoreToCandidate,
            }}
            submitLabel="Save settings"
            submitting={updateTest.isPending}
            onSubmit={(values) => updateTest.mutate(values)}
          />
          {updateTest.isError && (
            <p className="mt-2 text-sm text-danger">{getApiErrorMessage(updateTest.error)}</p>
          )}
        </div>
      )}
    </section>
  );
}

function StatusActions({ test, questionsDirty }: { test: McqTestDetail; questionsDirty: boolean }) {
  const navigate = useNavigate();
  const changeStatus = useChangeTestStatus(test.id);
  const deleteTest = useDeleteTest();
  const untouched = test.attemptCount === 0;

  const button =
    "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold disabled:opacity-50";

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap justify-end gap-2">
        {test.status === "DRAFT" && (
          <>
            <button
              onClick={() => {
                if (window.confirm(`Delete "${test.title}"? This can't be undone.`)) {
                  deleteTest.mutate(test.id, { onSuccess: () => navigate("/app/tests") });
                }
              }}
              className={`${button} border border-line text-ink-soft hover:text-danger`}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
            <button
              onClick={() => changeStatus.mutate("publish")}
              disabled={changeStatus.isPending || test.questionCount === 0 || questionsDirty}
              title={
                questionsDirty
                  ? "Save your question changes first"
                  : test.questionCount === 0
                    ? "Add at least one question first"
                    : undefined
              }
              className={`${button} bg-live text-white hover:opacity-90`}
            >
              <Rocket className="h-4 w-4" /> Publish
            </button>
          </>
        )}

        {test.status !== "DRAFT" && (
          <>
            {untouched && (
              <button
                onClick={() => changeStatus.mutate("revert-to-draft")}
                disabled={changeStatus.isPending}
                className={`${button} border border-line text-ink hover:border-signal/50`}
              >
                <RotateCcw className="h-4 w-4" /> Back to draft
              </button>
            )}
            {test.status === "PUBLISHED" ? (
              <button
                onClick={() => {
                  if (window.confirm("Close this test? Nobody new will be able to start it.")) {
                    changeStatus.mutate("close");
                  }
                }}
                disabled={changeStatus.isPending}
                className={`${button} border border-line text-ink hover:border-warn/50`}
              >
                <Lock className="h-4 w-4" /> Close
              </button>
            ) : (
              <button
                onClick={() => changeStatus.mutate("reopen")}
                disabled={changeStatus.isPending}
                className={`${button} border border-line text-ink hover:border-live/50`}
              >
                <Rocket className="h-4 w-4" /> Reopen
              </button>
            )}
            <Link
              to={`/app/tests/${test.id}/results`}
              className={`${button} bg-signal text-white hover:bg-signal-strong`}
            >
              <BarChart3 className="h-4 w-4" /> Results ({test.submittedCount})
            </Link>
          </>
        )}
      </div>

      {(changeStatus.isError || deleteTest.isError) && (
        <p className="text-xs text-danger">
          {getApiErrorMessage(changeStatus.error ?? deleteTest.error)}
        </p>
      )}
    </div>
  );
}

export default function TestEditorPage() {
  const { id = "" } = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const isAuthor = Boolean(user && TEST_AUTHOR_ROLES.includes(user.role));
  const [questionsDirty, setQuestionsDirty] = useState(false);

  const test = useTest(isAuthor ? id : "");

  if (!isAuthor) {
    return (
      <AppLayout>
        <p className="mt-6 rounded-xl border border-dashed border-line px-4 py-10 text-center text-sm text-ink-soft">
          Building tests is available to recruiters, faculty and admins.
        </p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Link
        to="/app/tests"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> All tests
      </Link>

      {test.isLoading && <p className="mt-6 text-sm text-ink-soft">Loading test...</p>}
      {test.isError && (
        <p className="mt-6 rounded-lg bg-danger/5 px-3.5 py-2.5 text-sm text-danger">
          {getApiErrorMessage(test.error)}
        </p>
      )}

      {test.data && (
        <div className="mt-4 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate font-display text-2xl font-semibold text-ink">
                  {test.data.title}
                </h1>
                <TestStatusBadge status={test.data.status} />
              </div>
              <p className="mt-1 text-sm text-ink-soft">
                {test.data.questionCount} question{test.data.questionCount === 1 ? "" : "s"} ·{" "}
                {test.data.totalPoints} points · {test.data.attemptCount} attempt
                {test.data.attemptCount === 1 ? "" : "s"}
              </p>
            </div>
            <StatusActions test={test.data} questionsDirty={questionsDirty} />
          </div>

          {test.data.accessCode && test.data.status !== "DRAFT" && (
            <ShareTestCard
              accessCode={test.data.accessCode}
              acceptingAttempts={test.data.status === "PUBLISHED"}
            />
          )}

          {test.data.status !== "DRAFT" && (
            <p className="rounded-lg bg-surface px-3.5 py-2.5 text-sm text-ink-soft">
              Published tests are locked so every candidate gets the same questions.
              {test.data.attemptCount === 0
                ? " Move it back to draft to edit - nobody has started it yet."
                : " To change questions now, create a new test."}
            </p>
          )}

          <SettingsSection test={test.data} />

          {test.data.status === "DRAFT" && (
            <QuestionGenerator
              testId={test.data.id}
              remaining={MCQ_LIMITS.maxQuestionsPerTest - test.data.questionCount}
              blockedReason={questionsDirty ? "Save your question edits first." : null}
            />
          )}

          <QuestionListEditor
            // Remount when the saved question set changes (generated or
            // newly saved questions get ids) - not on a settings save,
            // which would throw away unsaved question edits.
            key={test.data.questions.map((question) => question.id).join(",")}
            testId={test.data.id}
            questions={test.data.questions}
            editable={test.data.status === "DRAFT"}
            onDirtyChange={setQuestionsDirty}
          />
        </div>
      )}
    </AppLayout>
  );
}
