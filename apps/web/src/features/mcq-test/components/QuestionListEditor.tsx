import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Save, Trash2, X } from "lucide-react";

import { cn } from "../../../lib/cn";
import { getApiErrorMessage } from "../../../lib/apiClient";

import {
  DIFFICULTY_LABELS,
  MCQ_LIMITS,
  OPTION_LETTERS,
  SOURCE_LABELS,
} from "../labels";
import { useSaveQuestions } from "../useMcqTests";
import type { McqDifficulty, McqQuestion, McqQuestionSource } from "../types";

interface EditableQuestion {
  /** Stable React key - `id` is absent until a new question is saved. */
  key: string;
  id?: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  topic: string;
  difficulty: McqDifficulty;
  points: number;
  source: McqQuestionSource;
}

function toEditable(question: McqQuestion): EditableQuestion {
  return { ...question, key: question.id };
}

function blankQuestion(): EditableQuestion {
  return {
    key: crypto.randomUUID(),
    text: "",
    options: ["", "", "", ""],
    correctOptionIndex: 0,
    explanation: "",
    topic: "",
    difficulty: "MEDIUM",
    points: 1,
    source: "MANUAL",
  };
}

/** The first problem that would stop the list from saving, if any. */
function findProblem(questions: EditableQuestion[]): string | null {
  for (const [index, question] of questions.entries()) {
    const label = `Question ${index + 1}`;
    const options = question.options.map((option) => option.trim());

    if (!question.text.trim()) return `${label} has no text.`;
    if (options.some((option) => !option)) return `${label} has an empty option.`;
    if (new Set(options.map((option) => option.toLowerCase())).size !== options.length) {
      return `${label} has two identical options.`;
    }
    if (question.correctOptionIndex >= options.length) {
      return `${label} needs a correct answer.`;
    }
  }

  return null;
}

interface QuestionListEditorProps {
  testId: string;
  questions: McqQuestion[];
  /** False for published/closed tests - shows the answer key read-only. */
  editable: boolean;
  onDirtyChange: (dirty: boolean) => void;
}

/**
 * Holds a local copy of the question list and saves it in one go.
 * Remount it (key on the test's updatedAt) whenever the server copy
 * changes, so it always starts from the saved state.
 */
export function QuestionListEditor({
  testId,
  questions: savedQuestions,
  editable,
  onDirtyChange,
}: QuestionListEditorProps) {
  const [questions, setQuestions] = useState<EditableQuestion[]>(() =>
    savedQuestions.map(toEditable)
  );
  const [dirty, setDirtyState] = useState(false);
  const saveQuestions = useSaveQuestions(testId);

  const setDirty = (value: boolean) => {
    setDirtyState(value);
    onDirtyChange(value);
  };

  // Unsaved edits are easy to lose with a stray refresh - ask first.
  useEffect(() => {
    if (!dirty) return;

    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const update = (next: EditableQuestion[]) => {
    setQuestions(next);
    setDirty(true);
  };

  const patch = (index: number, changes: Partial<EditableQuestion>) =>
    update(questions.map((question, i) => (i === index ? { ...question, ...changes } : question)));

  const move = (index: number, delta: -1 | 1) => {
    const next = [...questions];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    update(next);
  };

  const problem = findProblem(questions);

  const save = () =>
    saveQuestions.mutate(
      questions.map((question) => ({
        id: question.id,
        text: question.text.trim(),
        options: question.options.map((option) => option.trim()),
        correctOptionIndex: question.correctOptionIndex,
        explanation: question.explanation.trim() || undefined,
        topic: question.topic.trim() || undefined,
        difficulty: question.difficulty,
        points: question.points,
      })),
      { onSuccess: () => setDirty(false) }
    );

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold text-ink">
          Questions <span className="text-sm font-normal text-ink-soft">({questions.length})</span>
        </h2>

        {editable && (
          <div className="flex items-center gap-2">
            {dirty && problem && <span className="text-xs text-danger">{problem}</span>}
            {dirty && !problem && <span className="text-xs text-warn">Unsaved changes</span>}
            <button
              type="button"
              onClick={save}
              disabled={!dirty || Boolean(problem) || saveQuestions.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-signal px-3.5 py-2 text-sm font-semibold text-white hover:bg-signal-strong disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saveQuestions.isPending ? "Saving..." : "Save questions"}
            </button>
          </div>
        )}
      </div>

      {saveQuestions.isError && (
        <p className="rounded-lg bg-danger/5 px-3 py-2 text-sm text-danger">
          {getApiErrorMessage(saveQuestions.error)}
        </p>
      )}

      {questions.length === 0 && (
        <div className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-sm text-ink-soft">
          No questions yet. Generate some above, or add one by hand.
        </div>
      )}

      {questions.map((question, index) => (
        <div key={question.key} className="rounded-xl border border-line bg-panel p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-sm font-semibold text-ink">Q{index + 1}</span>
            <span className="rounded-full bg-signal/10 px-2 py-0.5 text-[11px] font-medium text-signal">
              {SOURCE_LABELS[question.source]}
            </span>

            {editable ? (
              <div className="ml-auto flex items-center gap-1.5">
                <select
                  value={question.difficulty}
                  onChange={(event) =>
                    patch(index, { difficulty: event.target.value as McqDifficulty })
                  }
                  className="rounded-md border border-line bg-panel px-2 py-1 text-xs"
                  aria-label="Difficulty"
                >
                  {Object.entries(DIFFICULTY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-1 text-xs text-ink-soft">
                  Points
                  <input
                    type="number"
                    min={1}
                    max={MCQ_LIMITS.maxPoints}
                    value={question.points}
                    onChange={(event) =>
                      patch(index, {
                        points: Math.min(
                          MCQ_LIMITS.maxPoints,
                          Math.max(1, Math.round(Number(event.target.value)) || 1)
                        ),
                      })
                    }
                    className="w-12 rounded-md border border-line bg-panel px-1.5 py-1 text-xs"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="rounded-md p-1 text-ink-soft hover:bg-surface hover:text-ink disabled:opacity-30"
                  aria-label="Move up"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === questions.length - 1}
                  className="rounded-md p-1 text-ink-soft hover:bg-surface hover:text-ink disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => update(questions.filter((_, i) => i !== index))}
                  className="rounded-md p-1 text-ink-soft hover:bg-danger/5 hover:text-danger"
                  aria-label="Delete question"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <span className="ml-auto text-xs text-ink-soft">
                {DIFFICULTY_LABELS[question.difficulty]} · {question.points} pt
                {question.points === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {editable ? (
            <textarea
              value={question.text}
              onChange={(event) => patch(index, { text: event.target.value })}
              rows={2}
              placeholder="Question text"
              className="mt-3 w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-signal"
            />
          ) : (
            <p className="mt-2 whitespace-pre-wrap text-sm text-ink">{question.text}</p>
          )}

          <ul className="mt-3 space-y-1.5">
            {question.options.map((option, optionIndex) => {
              const correct = optionIndex === question.correctOptionIndex;

              return (
                <li key={optionIndex} className="flex items-center gap-2">
                  {editable ? (
                    <>
                      <input
                        type="radio"
                        name={`correct-${question.key}`}
                        checked={correct}
                        onChange={() => patch(index, { correctOptionIndex: optionIndex })}
                        className="accent-live"
                        aria-label={`Mark option ${OPTION_LETTERS[optionIndex]} correct`}
                      />
                      <input
                        value={option}
                        onChange={(event) =>
                          patch(index, {
                            options: question.options.map((value, i) =>
                              i === optionIndex ? event.target.value : value
                            ),
                          })
                        }
                        placeholder={`Option ${OPTION_LETTERS[optionIndex]}`}
                        className={cn(
                          "flex-1 rounded-lg border bg-panel px-3 py-1.5 text-sm outline-none focus:border-signal",
                          correct ? "border-live/50" : "border-line"
                        )}
                      />
                      {question.options.length > MCQ_LIMITS.minOptions && (
                        <button
                          type="button"
                          onClick={() =>
                            patch(index, {
                              options: question.options.filter((_, i) => i !== optionIndex),
                              // Keep the key on the same option when one above it goes.
                              correctOptionIndex:
                                optionIndex < question.correctOptionIndex
                                  ? question.correctOptionIndex - 1
                                  : optionIndex === question.correctOptionIndex
                                    ? 0
                                    : question.correctOptionIndex,
                            })
                          }
                          className="rounded-md p-1 text-ink-soft hover:text-danger"
                          aria-label="Remove option"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </>
                  ) : (
                    <span
                      className={cn(
                        "flex-1 rounded-lg border px-3 py-1.5 text-sm",
                        correct
                          ? "border-live/40 bg-live/5 font-medium text-ink"
                          : "border-line text-ink-soft"
                      )}
                    >
                      <span className="mr-2 font-mono text-xs">{OPTION_LETTERS[optionIndex]}.</span>
                      {option}
                      {correct && <span className="ml-2 text-xs text-live">✓ correct</span>}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>

          {editable && question.options.length < MCQ_LIMITS.maxOptions && (
            <button
              type="button"
              onClick={() => patch(index, { options: [...question.options, ""] })}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-signal hover:underline"
            >
              <Plus className="h-3.5 w-3.5" /> Add option
            </button>
          )}

          {editable ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_200px]">
              <input
                value={question.explanation}
                onChange={(event) => patch(index, { explanation: event.target.value })}
                placeholder="Explanation (optional - only you see it)"
                className="rounded-lg border border-line bg-panel px-3 py-1.5 text-xs outline-none focus:border-signal"
              />
              <input
                value={question.topic}
                onChange={(event) => patch(index, { topic: event.target.value })}
                placeholder="Topic (optional)"
                className="rounded-lg border border-line bg-panel px-3 py-1.5 text-xs outline-none focus:border-signal"
              />
            </div>
          ) : (
            question.explanation && (
              <p className="mt-2 text-xs text-ink-soft">
                <span className="font-semibold">Why:</span> {question.explanation}
              </p>
            )
          )}
        </div>
      ))}

      {editable && (
        <button
          type="button"
          onClick={() => update([...questions, blankQuestion()])}
          disabled={questions.length >= MCQ_LIMITS.maxQuestionsPerTest}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-line py-3 text-sm font-medium text-ink-soft hover:border-signal/50 hover:text-signal disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Add a question by hand
        </button>
      )}
    </section>
  );
}
