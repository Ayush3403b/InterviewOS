import { useEffect, useState } from "react";

import { useAuthStore } from "../../auth/store";

import {
  ProctoringGate,
  type ProctoringGateReadyData,
} from "../../proctoring/components/ProctoringGate";
import { FullscreenWarningOverlay } from "../../proctoring/components/FullscreenWarningOverlay";
import { useFullscreenEnforcement } from "../../proctoring/useFullscreenEnforcement";
import { InterviewMediaPanel } from "./InterviewMediaPanel";
import { QuestionPanel } from "./QuestionPanel";
import { EvaluationSummary } from "./EvaluationSummary";

import { useInterviewRoom } from "../useInterviewRoom";

import type { InterviewSessionDetail } from "../../dashboard/types";

interface LiveInterviewRoomProps {
  session: InterviewSessionDetail;
  onCompleted?: () => void;
}

interface InterviewRoomSessionProps extends LiveInterviewRoomProps {
  initData: ProctoringGateReadyData;
}

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

  // Exits stop counting once the interview is wrapping up (or paused).
  const fullscreen = useFullscreenEnforcement({
    enabled:
      phase !== "completed" &&
      phase !== "generating-evaluation" &&
      session.status !== "PAUSED",
    onLimitReached: () => void finishInterview(),
    sessionLabel: "interview",
  });
  const terminationReason = fullscreen.terminationReason;

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

      <FullscreenWarningOverlay enforcement={fullscreen} sessionLabel="interview" />
    </div>
  );
}
