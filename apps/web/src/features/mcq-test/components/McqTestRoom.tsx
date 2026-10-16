import { useEffect, useEffectEvent, useRef, useState } from "react";
import axios from "axios";
import { AlertTriangle, ChevronLeft, ChevronRight, Clock, Send } from "lucide-react";

import { cn } from "../../../lib/cn";
import { getApiErrorMessage } from "../../../lib/apiClient";
import { useAuthStore } from "../../auth/store";

import type { ProctoringGateReadyData } from "../../proctoring/components/ProctoringGate";
import { FullscreenWarningOverlay } from "../../proctoring/components/FullscreenWarningOverlay";
import { useFullscreenEnforcement } from "../../proctoring/useFullscreenEnforcement";

import { OPTION_LETTERS } from "../labels";
import { formatRemaining, useCountdown } from "../useCountdown";
import { useSaveAnswer, useSubmitAttempt } from "../useMcqAttempt";
import type { McqCandidateAttempt, McqSubmitReason } from "../types";

import { ProctoredCameraPanel } from "./ProctoredCameraPanel";

const LOW_TIME_MS = 60_000;

function exitFullscreenQuietly() {
  if (document.fullscreenElement) {
    void document.exitFullscreen().catch(() => undefined);
  }
}

interface McqTestRoomProps {
  /** An IN_PROGRESS attempt. */
  attempt: McqCandidateAttempt;
  initData: ProctoringGateReadyData;
  onSubmitted: (attempt: McqCandidateAttempt) => void;
}

export function McqTestRoom({ attempt, initData, onSubmitted }: McqTestRoomProps) {
  const accessToken = useAuthStore((state) => state.accessToken);

  const [answers, setAnswers] = useState<Record<string, number>>(attempt.answers);
  const [unsaved, setUnsaved] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const saveAnswer = useSaveAnswer(attempt.id);
  const submitAttempt = useSubmitAttempt(attempt.id);

  /** One save chain per question, so rapid re-clicks land in order. */
  const saveChains = useRef(new Map<string, Promise<void>>());
  const submitStarted = useRef(false);

  const remainingMs = useCountdown(attempt.deadlineAt, attempt.serverNow);
  const timeUp = remainingMs <= 0;

  const finish = async (reason: McqSubmitReason) => {
    if (submitStarted.current) return;
    submitStarted.current = true;
    setSubmitting(true);
    setConfirming(false);

    // Let in-flight answer saves land first so they're scored.
    await Promise.allSettled([...saveChains.current.values()]);

    submitAttempt.mutate(reason, {
      onSuccess: (submitted) => {
        exitFullscreenQuietly();
        onSubmitted(submitted);
      },
      onError: () => {
        submitStarted.current = false;
        setSubmitting(false);
      },
    });
  };

  const fullscreen = useFullscreenEnforcement({
    enabled: !submitting,
    onLimitReached: () => void finish("PROCTORING"),
    sessionLabel: "test",
  });

  const onTimeUp = useEffectEvent(() => void finish("TIME_UP"));

  useEffect(() => {
    if (timeUp) onTimeUp();
  }, [timeUp]);

  const persist = (questionId: string, selectedOptionIndex: number | null) => {
    const previous = saveChains.current.get(questionId) ?? Promise.resolve();

    const next = previous.then(() =>
      saveAnswer
        .mutateAsync({ questionId, selectedOptionIndex })
        .then(() => setUnsaved((ids) => ids.filter((id) => id !== questionId)))
        .catch((error: unknown) => {
          // 409 = the server already closed this attempt (time ran out).
          if (axios.isAxiosError(error) && error.response?.status === 409) {
            void finish("TIME_UP");
            return;
          }
          setUnsaved((ids) => (ids.includes(questionId) ? ids : [...ids, questionId]));
        })
    );

    saveChains.current.set(questionId, next);
  };

  const choose = (questionId: string, optionIndex: number | null) => {
    if (submitting) return;

    setAnswers((prev) => {
      const nextAnswers = { ...prev };
      if (optionIndex === null) delete nextAnswers[questionId];
      else nextAnswers[questionId] = optionIndex;
      return nextAnswers;
    });

    persist(questionId, optionIndex);
  };

  const retryUnsaved = () => {
    for (const questionId of unsaved) {
      persist(questionId, answers[questionId] ?? null);
    }
  };

  if (!accessToken) {
    return (
      <p className="m-6 rounded-lg bg-danger/5 px-3.5 py-2.5 text-sm text-danger">
        Missing session token - please sign in again.
      </p>
    );
  }

  const questions = attempt.questions;
  const question = questions[current];
  const answeredCount = questions.filter((q) => answers[q.id] !== undefined).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="relative flex min-h-full gap-4 p-4">
      {/* ── Left: invigilation + navigator ─────────────────────────── */}
      <aside className="w-[300px] shrink-0 space-y-3">
        <ProctoredCameraPanel
          attemptId={attempt.id}
          accessToken={accessToken}
          consentGiven={initData.consentGiven}
          referenceFrame={initData.referenceFrame}
        />

        <div className="rounded-2xl border border-line bg-panel p-3">
          <p className="text-xs font-semibold text-ink-soft">
            Answered {answeredCount} of {questions.length}
          </p>
          <div className="mt-2 grid grid-cols-6 gap-1.5">
            {questions.map((q, index) => (
              <button
                key={q.id}
                type="button"
                onClick={() => setCurrent(index)}
                className={cn(
                  "h-8 rounded-md text-xs font-semibold transition",
                  index === current && "ring-2 ring-signal ring-offset-1",
                  unsaved.includes(q.id)
                    ? "bg-warn/20 text-warn"
                    : answers[q.id] !== undefined
                      ? "bg-signal text-white"
                      : "bg-surface text-ink-soft hover:bg-line"
                )}
                aria-label={`Question ${index + 1}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-live py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {submitting ? "Submitting..." : "Submit test"}
        </button>
      </aside>

      {/* ── Right: the question ───────────────────────────────────── */}
      <main className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-panel px-5 py-3">
          <div className="min-w-0">
            <p className="truncate font-display text-base font-semibold text-ink">
              {attempt.testTitle}
            </p>
            <p className="text-xs text-ink-soft">
              Question {current + 1} of {questions.length}
            </p>
          </div>
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-mono text-lg font-bold",
              remainingMs <= LOW_TIME_MS ? "bg-danger/10 text-danger animate-pulse" : "bg-surface text-ink"
            )}
            aria-label="Time remaining"
          >
            <Clock className="h-4 w-4" />
            {formatRemaining(remainingMs)}
          </div>
        </div>

        {unsaved.length > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-warn/10 px-3.5 py-2 text-sm text-warn">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" />
              {unsaved.length} answer{unsaved.length === 1 ? "" : "s"} didn't save - check your connection.
            </span>
            <button type="button" onClick={retryUnsaved} className="font-semibold underline">
              Retry now
            </button>
          </div>
        )}

        {submitAttempt.isError && (
          <p className="rounded-lg bg-danger/5 px-3.5 py-2.5 text-sm text-danger">
            Submitting failed: {getApiErrorMessage(submitAttempt.error)}. Try again.
          </p>
        )}

        {question && (
          <div className="flex-1 select-none rounded-2xl border border-line bg-panel p-6">
            <div className="flex items-start justify-between gap-3">
              <p className="whitespace-pre-wrap text-base font-medium leading-relaxed text-ink">
                {question.text}
              </p>
              <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-xs text-ink-soft">
                {question.points} pt{question.points === 1 ? "" : "s"}
              </span>
            </div>

            <div className="mt-5 space-y-2.5" role="radiogroup">
              {question.options.map((option, position) => {
                const selected = answers[question.id] === option.index;

                return (
                  <button
                    key={option.index}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={submitting}
                    onClick={() => choose(question.id, option.index)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition",
                      selected
                        ? "border-signal bg-signal/5 text-ink"
                        : "border-line text-ink hover:border-signal/40 hover:bg-surface"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                        selected ? "border-signal bg-signal text-white" : "border-line text-ink-soft"
                      )}
                    >
                      {OPTION_LETTERS[position]}
                    </span>
                    <span className="pt-0.5">{option.text}</span>
                  </button>
                );
              })}
            </div>

            {answers[question.id] !== undefined && !submitting && (
              <button
                type="button"
                onClick={() => choose(question.id, null)}
                className="mt-3 text-xs font-medium text-ink-soft hover:text-ink hover:underline"
              >
                Clear my answer
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCurrent((index) => Math.max(0, index - 1))}
            disabled={current === 0}
            className="inline-flex items-center gap-1 rounded-lg border border-line bg-panel px-4 py-2 text-sm font-medium text-ink disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          {current < questions.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrent((index) => Math.min(questions.length - 1, index + 1))}
              className="inline-flex items-center gap-1 rounded-lg bg-signal px-4 py-2 text-sm font-semibold text-white hover:bg-signal-strong"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-live px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              <Send className="h-4 w-4" /> Review & submit
            </button>
          )}
        </div>
      </main>

      {confirming && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/50 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-panel p-6 shadow-xl">
            <h2 className="font-display text-lg font-semibold text-ink">Submit your test?</h2>
            <p className="mt-2 text-sm text-ink-soft">
              {unansweredCount > 0
                ? `You've left ${unansweredCount} question${unansweredCount === 1 ? "" : "s"} unanswered. `
                : "You've answered every question. "}
              You can't change your answers after submitting.
            </p>
            {unsaved.length > 0 && (
              <p className="mt-2 text-sm font-medium text-warn">
                {unsaved.length} answer{unsaved.length === 1 ? " hasn't" : "s haven't"} saved yet -
                retry before submitting, or they won't count.
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink-soft hover:text-ink"
              >
                Keep working
              </button>
              <button
                type="button"
                onClick={() => void finish("MANUAL")}
                className="rounded-lg bg-live px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {submitting && fullscreen.terminationReason && (
        <p className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white shadow-lg">
          {fullscreen.terminationReason}
        </p>
      )}

      <FullscreenWarningOverlay enforcement={fullscreen} sessionLabel="test" />
    </div>
  );
}
