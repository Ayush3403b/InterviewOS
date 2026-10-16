import { useCallback, useEffect, useRef, useState } from "react";

import { getApiErrorMessage } from "../../lib/apiClient";

import * as interviewApi from "./api";
import { useDraftPersistence } from "./useDraftPersistence";

import type { InterviewSessionDetail } from "../dashboard/types";
import type { EvaluationResult, OrchestratorTurn } from "./types";

export type RoomPhase =
  | "loading-question"
  | "answering"
  | "submitting"
  | "generating-evaluation"
  | "completed"
  | "error";

type FailedStep = "load-question" | "submit-answer" | "evaluation" | null;

export interface UseInterviewRoomResult {
  phase: RoomPhase;
  currentTurn: OrchestratorTurn | null;
  totalQuestions: number;
  answer: string;
  setAnswer: (value: string) => void;
  submitAnswer: () => Promise<void>;
  finishInterview: () => Promise<void>;
  evaluation: EvaluationResult | null;
  error: string | null;
  retry: () => void;
}

/**
 * Talks to the Agent Orchestrator (modules/orchestrator) instead of
 * sequencing a static question bank + createTurn/submitAnswer/
 * createEvaluation/generateEvaluation/completeSession by hand. Each
 * question, its difficulty, and whether it's a follow-up are now
 * decided dynamically per-turn by the Planner/Question agents on the
 * backend - this hook just drives that loop and renders whatever it
 * returns.
 *
 * Draft persistence: every character the candidate types is debounce-
 * saved to localStorage under a key scoped to `sessionId + turnId`.
 * On mount (or on turn change) the hook reads that draft back and
 * pre-fills the textarea — so a hard refresh mid-answer loses nothing.
 * The draft is cleared on successful submit.
 */
export function useInterviewRoom(
  session: InterviewSessionDetail
): UseInterviewRoomResult {
  const roomStartedAt = useRef(0);
  const questionStartedAt = useRef(0);

  const [phase, setPhase] = useState<RoomPhase>("loading-question");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [currentTurn, setCurrentTurn] = useState<OrchestratorTurn | null>(
    null
  );
  const [answer, setAnswerState] = useState("");
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failedStep, setFailedStep] = useState<FailedStep>(null);

  // Draft persistence — scoped to the current session + turn.
  const { saveDraft, clearDraft } = useDraftPersistence(
    session.id,
    currentTurn?.id
  );

  // Wrap setAnswer so every change also updates the draft.
  const setAnswer = useCallback(
    (value: string) => {
      setAnswerState(value);
      saveDraft(value);
    },
    [saveDraft]
  );

  useEffect(() => {
    roomStartedAt.current = Date.now();
  }, []);

  const runEvaluation = useCallback(async (): Promise<void> => {
    setPhase("generating-evaluation");
    setError(null);
    setFailedStep(null);

    try {
      const durationSeconds = Math.round(
        (Date.now() - roomStartedAt.current) / 1000
      );

      const result = await interviewApi.finishInterview(
        session.id,
        durationSeconds
      );

      setEvaluation(result);
      setPhase("completed");
    } catch (err) {
      setError(getApiErrorMessage(err));
      setFailedStep("evaluation");
      setPhase("error");
    }
  }, [session.id]);

  // Asks the orchestrator for the next question. Phase is already
  // "loading-question" on mount by default; for subsequent questions
  // the trigger site (handleSubmitAnswer / retry) sets that phase
  // synchronously itself, since those run inside event handlers rather
  // than this effect.
  useEffect(() => {
    let cancelled = false;

    interviewApi
      .getNextQuestion(session.id)
      .then((response) => {
        if (cancelled) return;

        if (response.done || !response.turn) {
          void runEvaluation();
          return;
        }

        questionStartedAt.current = Date.now();
        setCurrentTurn(response.turn);

        // Pre-fill the textarea from any persisted draft for this turn.
        // We CANNOT use readDraft() here because it keys on `currentTurn?.id`
        // which is still null in React state at this point in the .then()
        // callback. Instead we read the draft directly using the known new turn id.
        const draftKey = `interview-draft-${session.id}-${response.turn.id}`;
        let savedDraft = "";
        try {
          const raw = localStorage.getItem(draftKey);
          if (raw) {
            const parsed = JSON.parse(raw) as { text: string; savedAt: number };
            const age = Date.now() - parsed.savedAt;
            const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;
            if (age <= DRAFT_TTL_MS) {
              savedDraft = parsed.text;
            }
          }
        } catch {
          // Fail silently — missing draft is not fatal.
        }
        setAnswerState(savedDraft);

        setError(null);
        setFailedStep(null);
        setPhase("answering");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(getApiErrorMessage(err));
        setFailedStep("load-question");
        setPhase("error");
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id, loadAttempt]);

  const handleSubmitAnswer = useCallback(async (): Promise<void> => {
    if (!currentTurn || !answer.trim()) {
      return;
    }

    setPhase("submitting");
    setError(null);
    setFailedStep(null);

    const timeTaken = Math.round(
      (Date.now() - questionStartedAt.current) / 1000
    );

    try {
      // Clear the draft before the network call so that even if the
      // component re-renders during the await, the old draft is gone.
      clearDraft();

      await interviewApi.submitOrchestratorAnswer(
        currentTurn.id,
        session.id,
        answer.trim(),
        timeTaken
      );

      setPhase("loading-question");
      setLoadAttempt((count) => count + 1);
    } catch (err) {
      setError(getApiErrorMessage(err));
      setFailedStep("submit-answer");
      setPhase("error");
    }
  }, [answer, clearDraft, currentTurn, session.id]);

  const retry = useCallback(() => {
    if (failedStep === "load-question") {
      setPhase("loading-question");
      setLoadAttempt((count) => count + 1);
    } else if (failedStep === "submit-answer") {
      void handleSubmitAnswer();
    } else if (failedStep === "evaluation") {
      void runEvaluation();
    }
  }, [failedStep, handleSubmitAnswer, runEvaluation]);

  const totalQuestions =
    session.sectionPlan && session.sectionPlan.length > 0
      ? session.sectionPlan.reduce(
          (acc: number, s) => acc + (s.maxQuestions || 0),
          0
        )
      : session.maxQuestions || 10;

  return {
    phase,
    currentTurn,
    totalQuestions,
    answer,
    setAnswer,
    submitAnswer: handleSubmitAnswer,
    finishInterview: runEvaluation,
    evaluation,
    error,
    retry,
  };
}

