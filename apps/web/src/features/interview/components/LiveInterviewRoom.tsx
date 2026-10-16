import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Maximize2, ShieldAlert, Timer } from "lucide-react";

import { useAuthStore } from "../../auth/store";

import { ProctoringGate, type ProctoringGateReadyData } from "./ProctoringGate";
import { InterviewMediaPanel } from "./InterviewMediaPanel";
import { QuestionPanel } from "./QuestionPanel";
import { EvaluationSummary } from "./EvaluationSummary";

import { useInterviewRoom } from "../useInterviewRoom";
import {
  isFullscreenActive,
  requestFullscreen,
} from "../../proctoring/deviceChecks";

import type { InterviewSessionDetail } from "../../dashboard/types";

interface LiveInterviewRoomProps {
  session: InterviewSessionDetail;
  onCompleted?: () => void;
}

interface InterviewRoomSessionProps extends LiveInterviewRoomProps {
  initData: ProctoringGateReadyData;
}

const MAX_FULLSCREEN_EXITS = 2;
const GRACE_PERIOD_SECONDS = 5;

/**
 * Top-level room: shows the proctoring readiness gate first, and only
 * mounts the actual interview session once the candidate has passed it.
 */
export function LiveInterviewRoom({
  session,
  onCompleted,
}: LiveInterviewRoomProps) {
  const [initData, setInitData] = useState<ProctoringGateReadyData | null>(null);

  if (!initData) {
    return <ProctoringGate onReady={(data) => setInitData(data)} />;
  }

  return (
    <InterviewRoomSession
      session={session}
      initData={initData}
      onCompleted={onCompleted}
    />
  );
}

function InterviewRoomSession({
  session,
  initData,
  onCompleted,
}: InterviewRoomSessionProps) {
  const accessToken = useAuthStore((state) => state.accessToken);

  const {
    phase,
    currentTurn,
    totalQuestions,
    answer,
    setAnswer,
    submitAnswer,
    finishInterview,
    evaluation,
    error,
    retry,
  } = useInterviewRoom(session);

  // ── Fullscreen Exit Enforcement State ─────────────────────
  const [exitCount, setExitCount] = useState(0);
  const [warningActive, setWarningActive] = useState(false);
  const [countdown, setCountdown] = useState(GRACE_PERIOD_SECONDS);
  const [terminationReason, setTerminationReason] = useState<string | null>(null);

  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishInterviewRef = useRef(finishInterview);
  finishInterviewRef.current = finishInterview;

  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  // Listen to fullscreen changes during the live interview
  useEffect(() => {
    const handleFullscreenChange = () => {
      // Don't track if already completed or generating evaluation
      if (
        phaseRef.current === "completed" ||
        phaseRef.current === "generating-evaluation" ||
        session.status === "PAUSED"
      ) {
        return;
      }

      const active = isFullscreenActive();

      if (!active) {
        // User exited fullscreen
        setExitCount((prevCount) => {
          const newCount = prevCount + 1;

          if (newCount > MAX_FULLSCREEN_EXITS) {
            // Exceeded maximum allowed exits (3rd exit)
            setTerminationReason(
              `Maximum fullscreen exit limit reached (${MAX_FULLSCREEN_EXITS}/${MAX_FULLSCREEN_EXITS}). Your interview has been auto-submitted.`
            );
            void finishInterviewRef.current();
            setWarningActive(false);
            return newCount;
          }

          // Trigger 5-second countdown warning
          setCountdown(GRACE_PERIOD_SECONDS);
          setWarningActive(true);
          return newCount;
        });
      } else {
        // User re-entered fullscreen -> dismiss warning and clear countdown
        setWarningActive(false);
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  // Drive the 5-second countdown timer when warning is active
  useEffect(() => {
    if (!warningActive) {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      return;
    }

    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          setTerminationReason(
            `Fullscreen grace period expired (5 seconds). Your interview has been auto-submitted.`
          );
          setWarningActive(false);
          void finishInterviewRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, [warningActive]);

  const handleReturnToFullscreen = async () => {
    try {
      await requestFullscreen();
    } catch {
      // Browser blocked
    }
  };

  useEffect(() => {
    if (phase === "completed") {
      onCompleted?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (phase === "completed" && evaluation) {
    return <EvaluationSummary evaluation={evaluation} />;
  }

  if (!accessToken) {
    return (
      <p className="rounded-lg bg-danger/5 px-3.5 py-2.5 text-sm text-danger">
        Missing session token - please sign in again.
      </p>
    );
  }

  return (
    <div className="relative flex min-h-full gap-4 overflow-hidden">
      {/* ── LEFT – Media / Proctoring panel ─────────────────────── */}
      <div className="w-[45%] min-w-[340px] flex-shrink-0 overflow-y-auto">
        <InterviewMediaPanel
          interviewSessionId={session.id}
          accessToken={accessToken}
          autoStartCamera
          consentGiven={initData.consentGiven}
          referenceFrame={initData.referenceFrame}
        />
      </div>

      {/* ── RIGHT – Question / Answer panel ─────────────────────── */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3">
        {phase === "generating-evaluation" ? (
          <div className="rounded-2xl border border-line bg-panel p-8 text-center flex flex-col items-center justify-center flex-1">
            <span className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-signal/30 border-t-signal" />
            <p className="text-base font-semibold text-ink">
              Generating your AI evaluation...
            </p>
            {terminationReason && (
              <p className="mt-2 text-xs text-danger font-medium max-w-md">
                {terminationReason}
              </p>
            )}
          </div>
        ) : (
          <QuestionPanel
            questionNumber={currentTurn?.turnNumber ?? 1}
            totalQuestions={totalQuestions}
            question={currentTurn?.question}
            answer={answer}
            onAnswerChange={setAnswer}
            onSubmit={() => void submitAnswer()}
            submitting={phase === "submitting"}
            loadingQuestion={phase === "loading-question"}
          />
        )}

        {phase === "error" && error && (
          <div className="flex items-center justify-between rounded-lg bg-danger/5 px-3.5 py-2.5 text-sm text-danger">
            <span>{error}</span>
            <button onClick={retry} className="font-medium underline">
              Retry
            </button>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          URGENT FULLSCREEN EXIT WARNING OVERLAY (5s COUNTDOWN)
         ══════════════════════════════════════════════════════════ */}
      {warningActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border-2 border-danger/80 bg-panel p-6 shadow-2xl text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-danger/15 text-danger animate-bounce">
              <ShieldAlert className="h-8 w-8" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-danger/10 px-3 py-1 text-xs font-bold text-danger mb-2">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>
                  VIOLATION: Exit {exitCount} of {MAX_FULLSCREEN_EXITS}
                </span>
              </div>
              <h2 className="font-display text-xl font-bold text-ink">
                Fullscreen Mode Exited!
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                Leaving fullscreen is prohibited during this proctored interview.
                You must return to fullscreen immediately.
              </p>
            </div>

            {/* Big Countdown Timer Display */}
            <div className="rounded-xl border border-danger/30 bg-danger/5 p-4">
              <div className="flex items-center justify-center gap-2 text-danger font-mono text-3xl font-black">
                <Timer className="h-7 w-7 animate-spin" />
                <span>00:0{countdown}</span>
              </div>
              <p className="mt-1 text-xs font-semibold text-danger/90">
                Interview will be AUTO-SUBMITTED in {countdown} second{countdown !== 1 ? "s" : ""}
              </p>

              {/* Countdown Progress Bar */}
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-line">
                <div
                  className="h-full bg-danger transition-all duration-1000 ease-linear"
                  style={{
                    width: `${(countdown / GRACE_PERIOD_SECONDS) * 100}%`,
                  }}
                />
              </div>
            </div>

            <p className="text-xs text-ink-soft">
              {exitCount >= MAX_FULLSCREEN_EXITS ? (
                <span className="text-danger font-bold">
                  ⚠️ This is your LAST warning. Next exit terminates session immediately.
                </span>
              ) : (
                <span>
                  Allowed exits remaining:{" "}
                  <strong>{MAX_FULLSCREEN_EXITS - exitCount}</strong>
                </span>
              )}
            </p>

            <button
              type="button"
              onClick={() => void handleReturnToFullscreen()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-danger py-3.5 text-base font-bold text-white shadow-lg shadow-danger/30 hover:bg-danger/90 transition active:scale-95"
            >
              <Maximize2 className="h-5 w-5" />
              Return to Fullscreen Now ({countdown}s)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
