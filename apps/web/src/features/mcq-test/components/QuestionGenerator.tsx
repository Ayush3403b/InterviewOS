import { useRef, useState } from "react";
import { FileText, ImageIcon, Sparkles, Upload, X } from "lucide-react";

import { cn } from "../../../lib/cn";
import { getApiErrorMessage } from "../../../lib/apiClient";

import {
  DIFFICULTY_CHOICE_LABELS,
  MATERIAL_MODE_LABELS,
  MCQ_LIMITS,
} from "../labels";
import { useGenerateFromTopics, useImportFromFiles } from "../useMcqTests";
import type { GenerationResult, McqDifficultyChoice, McqMaterialMode } from "../types";

type Tab = "topics" | "files";

const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-signal";

function formatBytes(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function describeResult(result: GenerationResult): string {
  const what =
    result.mode === "EXTRACTED"
      ? "copied from your files"
      : result.mode === "GENERATED"
        ? "written from your files"
        : "generated";

  return `Added ${result.addedCount} question${result.addedCount === 1 ? "" : "s"} (${what}). Check each one below - AI can get answers wrong.`;
}

interface QuestionGeneratorProps {
  testId: string;
  /** Room left in the test. */
  remaining: number;
  /** Generating replaces the editor's state - block it while edits are unsaved. */
  blockedReason: string | null;
}

export function QuestionGenerator({ testId, remaining, blockedReason }: QuestionGeneratorProps) {
  const [tab, setTab] = useState<Tab>("topics");

  const [topics, setTopics] = useState("");
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState<McqDifficultyChoice>("MIXED");
  const [instructions, setInstructions] = useState("");
  const [mode, setMode] = useState<McqMaterialMode>("AUTO");
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<GenerationResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fromTopics = useGenerateFromTopics(testId);
  const fromFiles = useImportFromFiles(testId);
  const active = tab === "topics" ? fromTopics : fromFiles;

  const maxCount = Math.min(MCQ_LIMITS.maxGeneratedPerRequest, remaining);
  const effectiveCount = Math.max(1, Math.min(count, maxCount));

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;

    const next = [...files];
    for (const file of Array.from(incoming)) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setFileError(`"${file.name}" isn't a PDF or JPG/PNG/WEBP image.`);
        return;
      }
      if (file.size > MCQ_LIMITS.maxFileBytes) {
        setFileError(`"${file.name}" is over 10 MB.`);
        return;
      }
      next.push(file);
    }

    if (next.length > MCQ_LIMITS.maxFiles) {
      setFileError(`Up to ${MCQ_LIMITS.maxFiles} files at a time.`);
      return;
    }

    setFileError(null);
    setFiles(next);
  };

  const canSubmit =
    !blockedReason &&
    remaining > 0 &&
    !active.isPending &&
    (tab === "topics" ? topics.trim().length >= 2 : files.length > 0);

  const submit = () => {
    setLastResult(null);
    const onSuccess = (result: GenerationResult) => {
      setLastResult(result);
      if (tab === "files") setFiles([]);
    };

    if (tab === "topics") {
      fromTopics.mutate(
        {
          topics: topics.trim(),
          count: effectiveCount,
          difficulty,
          instructions: instructions.trim() || undefined,
        },
        { onSuccess }
      );
    } else {
      fromFiles.mutate(
        {
          files,
          count: effectiveCount,
          difficulty,
          mode,
          instructions: instructions.trim() || undefined,
        },
        { onSuccess }
      );
    }
  };

  return (
    <section className="rounded-2xl border border-line bg-panel p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-signal" />
        <h2 className="font-display text-lg font-semibold text-ink">Generate questions with AI</h2>
      </div>

      <div className="mt-4 inline-flex rounded-lg border border-line bg-surface p-0.5 text-sm">
        {(
          [
            ["topics", "From topics"],
            ["files", "From PDF or photos"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={cn(
              "rounded-md px-3 py-1.5 font-medium transition",
              tab === value ? "bg-panel text-ink shadow-sm" : "text-ink-soft hover:text-ink"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-4">
        {tab === "topics" ? (
          <div>
            <label className="text-sm font-medium text-ink-soft">Topics</label>
            <textarea
              value={topics}
              onChange={(event) => setTopics(event.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="e.g. JavaScript closures, the event loop, promises and async/await"
              className={inputClass}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                addFiles(event.dataTransfer.files);
              }}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-surface/50 px-4 py-6 text-center"
            >
              <Upload className="h-6 w-6 text-ink-soft" />
              <p className="mt-2 text-sm text-ink">
                Drop PDFs or photos of pages here, or{" "}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="font-semibold text-signal hover:underline"
                >
                  browse
                </button>
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                Question papers or study notes · PDF, JPG, PNG, WEBP · up to {MCQ_LIMITS.maxFiles}{" "}
                files, 10 MB each
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPTED_TYPES.join(",")}
                className="hidden"
                onChange={(event) => {
                  addFiles(event.target.files);
                  event.target.value = "";
                }}
              />
            </div>

            {fileError && <p className="text-xs text-danger">{fileError}</p>}

            {files.length > 0 && (
              <ul className="space-y-1.5">
                {files.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm"
                  >
                    {file.type === "application/pdf" ? (
                      <FileText className="h-4 w-4 text-ink-soft" />
                    ) : (
                      <ImageIcon className="h-4 w-4 text-ink-soft" />
                    )}
                    <span className="min-w-0 flex-1 truncate text-ink">{file.name}</span>
                    <span className="text-xs text-ink-soft">{formatBytes(file.size)}</span>
                    <button
                      type="button"
                      onClick={() => setFiles(files.filter((_, i) => i !== index))}
                      className="text-ink-soft hover:text-danger"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div>
              <label className="text-sm font-medium text-ink-soft">What's in the files?</label>
              <select
                value={mode}
                onChange={(event) => setMode(event.target.value as McqMaterialMode)}
                className={inputClass}
              >
                {Object.entries(MATERIAL_MODE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-ink-soft">
              {tab === "files" && mode === "EXTRACT" ? "Up to" : "How many"}
            </label>
            <input
              type="number"
              min={1}
              max={maxCount}
              value={count}
              onChange={(event) => setCount(Number(event.target.value) || 1)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-ink-soft">Difficulty</label>
            <select
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value as McqDifficultyChoice)}
              className={inputClass}
            >
              {Object.entries(DIFFICULTY_CHOICE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-ink-soft">
            Extra instructions <span className="font-normal">(optional)</span>
          </label>
          <input
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            maxLength={1000}
            placeholder={
              tab === "topics"
                ? "e.g. Aim at junior developers; include one code-reading question"
                : "e.g. Only use chapter 3"
            }
            className={inputClass}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="inline-flex items-center gap-1.5 rounded-lg bg-signal px-4 py-2 text-sm font-semibold text-white hover:bg-signal-strong disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {active.isPending
              ? tab === "files"
                ? "Reading your files..."
                : "Writing questions..."
              : `Generate ${effectiveCount} question${effectiveCount === 1 ? "" : "s"}`}
          </button>
          {active.isPending && (
            <span className="text-xs text-ink-soft">This can take up to a minute.</span>
          )}
          {blockedReason && <span className="text-xs text-warn">{blockedReason}</span>}
          {remaining <= 0 && (
            <span className="text-xs text-warn">
              This test is full ({MCQ_LIMITS.maxQuestionsPerTest} questions).
            </span>
          )}
        </div>

        {active.isError && (
          <p className="rounded-lg bg-danger/5 px-3 py-2 text-sm text-danger">
            {getApiErrorMessage(active.error)}
          </p>
        )}

        {lastResult && (
          <div className="rounded-lg bg-live/5 px-3 py-2 text-sm text-ink">
            {describeResult(lastResult)}
            {lastResult.truncated && (
              <p className="mt-1 text-xs text-warn">
                Your PDF text was very long, so only the first part was used. Upload fewer pages
                at a time to cover the rest.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
