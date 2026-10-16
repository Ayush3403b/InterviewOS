import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { Camera, Clock, ListChecks, Maximize2, ShieldCheck } from "lucide-react";

import { AppLayout } from "../layouts/AppLayout";
import {
  AttemptResultCard,
  McqTestRoom,
  useAttempt,
  useStartAttempt,
  useTestPreview,
  type McqCandidateAttempt,
  type McqTestPreview,
} from "../features/mcq-test";
import { ProctoringGate, type ProctoringGateReadyData } from "../features/proctoring";
import { getApiErrorMessage } from "../lib/apiClient";

type Stage = "intro" | "gate" | "room";

const RULES = [
  { icon: Camera, text: "Your camera and microphone stay on, and the session is monitored." },
  { icon: Maximize2, text: "The test runs in fullscreen. Leaving it more than twice submits your test." },
  { icon: ShieldCheck, text: "Don't switch tabs, copy text, or have anyone else in view." },
  { icon: ListChecks, text: "You get one attempt. Answers save as you go." },
];

function Intro({
  preview,
  onContinue,
}: {
  preview: McqTestPreview;
  onContinue: () => void;
}) {
  const resuming = preview.myAttempt?.status === "IN_PROGRESS";
  const canStart = resuming || preview.acceptingAttempts;

  return (
    <div className="mx-auto mt-6 w-full max-w-2xl rounded-2xl border border-line bg-panel p-8 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-signal">Proctored MCQ test</p>
      <h1 className="mt-1 font-display text-2xl font-bold text-ink">{preview.title}</h1>
      <p className="mt-2 flex items-center gap-4 text-sm text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-4 w-4" /> {preview.durationMinutes} minutes
        </span>
        <span>
          {preview.questionCount} question{preview.questionCount === 1 ? "" : "s"}
        </span>
      </p>

      {preview.instructions && (
        <div className="mt-5 rounded-xl border border-line bg-surface/60 p-4">
          <p className="text-xs font-semibold text-ink-soft">Instructions</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{preview.instructions}</p>
        </div>
      )}

      <ul className="mt-5 space-y-2.5">
        {RULES.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-2.5 text-sm text-ink">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-signal" />
            {text}
          </li>
        ))}
      </ul>

      {resuming && (
        <p className="mt-5 rounded-lg bg-warn/10 px-3.5 py-2.5 text-sm text-warn">
          You've already started this test - the timer kept running while you were away.
        </p>
      )}

      {canStart ? (
        <>
          <button
            type="button"
            onClick={onContinue}
            className="mt-6 w-full rounded-xl bg-signal py-3 text-sm font-bold text-white hover:bg-signal-strong"
          >
            {resuming ? "Continue to camera check & resume" : "Continue to camera check"}
          </button>
          <p className="mt-2 text-center text-xs text-ink-soft">
            The timer starts only after the checks pass.
          </p>
        </>
      ) : (
        <p className="mt-6 rounded-lg bg-surface px-3.5 py-2.5 text-center text-sm text-ink-soft">
          This test isn't accepting attempts right now.
        </p>
      )}
    </div>
  );
}

export default function TakeTestPage() {
  const { code = "" } = useParams<{ code: string }>();
  const preview = useTestPreview(code);
  const startAttempt = useStartAttempt();

  const [stage, setStage] = useState<Stage>("intro");
  const [initData, setInitData] = useState<ProctoringGateReadyData | null>(null);
  const [attempt, setAttempt] = useState<McqCandidateAttempt | null>(null);

  // Coming back to a test already submitted: show its result.
  const submittedId =
    preview.data?.myAttempt?.status === "SUBMITTED" ? preview.data.myAttempt.id : null;
  const previousAttempt = useAttempt(attempt ? null : submittedId);

  const finished =
    attempt?.status === "SUBMITTED"
      ? attempt
      : previousAttempt.data?.status === "SUBMITTED"
        ? previousAttempt.data
        : null;

  if (finished) {
    return (
      <AppLayout>
        <AttemptResultCard attempt={finished} />
      </AppLayout>
    );
  }

  if (stage === "room" && attempt && initData) {
    return (
      <AppLayout noPadding>
        <McqTestRoom attempt={attempt} initData={initData} onSubmitted={setAttempt} />
      </AppLayout>
    );
  }

  if (stage === "gate") {
    return (
      <AppLayout noPadding>
        <ProctoringGate
          title="Test Readiness Check"
          beginLabel={preview.data?.myAttempt ? "Resume test" : "Start test"}
          onReady={(data) => {
            setInitData(data);
            startAttempt.mutate(code, {
              onSuccess: (started) => {
                setAttempt(started);
                setStage("room");
              },
            });
          }}
        />
        {(startAttempt.isPending || startAttempt.isError) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4">
            <div className="w-full max-w-sm rounded-2xl bg-panel p-6 text-center shadow-xl">
              {startAttempt.isPending ? (
                <p className="text-sm font-medium text-ink">Starting your test...</p>
              ) : (
                <>
                  <p className="text-sm text-danger">{getApiErrorMessage(startAttempt.error)}</p>
                  <button
                    type="button"
                    onClick={() => {
                      startAttempt.reset();
                      setStage("intro");
                    }}
                    className="mt-4 rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink"
                  >
                    Back
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </AppLayout>
    );
  }

  const notFound =
    preview.isError &&
    axios.isAxiosError(preview.error) &&
    preview.error.response?.status === 404;

  return (
    <AppLayout>
      {(preview.isLoading || previousAttempt.isLoading) && (
        <p className="mt-6 text-sm text-ink-soft">Loading test...</p>
      )}

      {preview.isError && (
        <div className="mx-auto mt-8 max-w-md rounded-2xl border border-line bg-panel p-6 text-center">
          <p className="text-sm text-ink">
            {notFound
              ? `No test matches the code "${code}".`
              : getApiErrorMessage(preview.error)}
          </p>
          <Link
            to="/app/tests"
            className="mt-4 inline-flex rounded-lg bg-signal px-4 py-2 text-sm font-semibold text-white"
          >
            Enter a different code
          </Link>
        </div>
      )}

      {preview.data && !submittedId && (
        <Intro preview={preview.data} onContinue={() => setStage("gate")} />
      )}
    </AppLayout>
  );
}
