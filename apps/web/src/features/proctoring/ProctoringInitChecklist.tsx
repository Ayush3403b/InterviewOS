import {
  CheckCircle2,
  XCircle,
  Loader2,
  Circle,
  ShieldCheck,
  Camera,
  Maximize2,
  Play,
  RotateCw,
  Sparkles,
} from "lucide-react";
import type { ProctoringInitStep, ProctoringInitStepStatus } from "./types";
import type { UseProctoringInitResult } from "./useProctoringInit";

function StatusIcon({ status }: { status: ProctoringInitStepStatus }) {
  switch (status) {
    case "passed":
      return <CheckCircle2 className="h-4 w-4 text-live shrink-0" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-danger shrink-0" />;
    case "checking":
      return <Loader2 className="h-4 w-4 text-warn animate-spin shrink-0" />;
    case "pending":
    default:
      return <Circle className="h-4 w-4 text-ink-soft/40 shrink-0" />;
  }
}

interface StepRowProps {
  step: ProctoringInitStep;
  onRetry: () => void;
}

function StepRow({ step, onRetry }: StepRowProps) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 transition hover:bg-surface/60">
      <div className="flex items-center gap-2.5 min-w-0">
        <StatusIcon status={step.status} />
        <div className="truncate">
          <p className="text-xs font-medium text-ink truncate">
            {step.label}
            {!step.required && (
              <span className="ml-1.5 text-[10px] font-normal text-ink-soft/80">
                (optional)
              </span>
            )}
          </p>
          <p className="text-[11px] text-ink-soft truncate">{step.message}</p>
        </div>
      </div>

      {step.status === "failed" && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 inline-flex items-center gap-1 rounded-md border border-line bg-panel px-2 py-0.5 text-[11px] font-medium text-ink-soft hover:bg-surface hover:text-ink transition"
        >
          <RotateCw className="h-3 w-3" />
          Retry
        </button>
      )}
    </li>
  );
}

interface ProctoringInitChecklistProps extends UseProctoringInitResult {
  onReady?: () => void;
}

/**
 * Renders a side-by-side single-frame readiness gate:
 * - Left column: Camera preview & Biometric disclosure
 * - Right column: System checklist & Launch actions
 */
export function ProctoringInitChecklist({
  steps,
  ready,
  running,
  consentGiven,
  setConsentGiven,
  videoRef,
  start,
  retryStep,
  enterFullscreen,
  failureReason,
  onReady,
}: ProctoringInitChecklistProps) {
  const fullscreenStep = steps.find((step) => step.id === "fullscreen");
  const needsFullscreen = fullscreenStep?.status !== "passed";
  const otherRequiredStepsPassed = steps
    .filter((step) => step.required && step.id !== "fullscreen")
    .every((step) => step.status === "passed");

  const passedCount = steps.filter((s) => s.status === "passed").length;
  const totalCount = steps.length;

  return (
    <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-line bg-panel shadow-xl">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-line px-6 py-4 bg-surface/40">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-signal/10 text-signal">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-display text-base font-bold text-ink">
              Interview Readiness Check
            </h2>
            <p className="text-xs text-ink-soft">
              Verifying hardware, browser permissions & AI proctoring engines
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1 text-xs font-medium text-ink-soft">
            <span>Checks:</span>
            <span className="font-semibold text-signal">
              {passedCount} / {totalCount}
            </span>
          </div>

          <button
            type="button"
            onClick={() => void enterFullscreen()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel px-2.5 py-1 text-xs font-medium text-ink hover:border-signal/40 hover:text-signal shadow-sm transition active:scale-95"
            title="Toggle fullscreen mode"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            <span>Go Fullscreen</span>
          </button>
        </div>
      </div>

      {/* 2-Column Split Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-0 divide-y md:divide-y-0 md:divide-x divide-line">
        {/* ── Left Column: Video Feed & Consent (5 cols) ────────── */}
        <div className="p-6 md:col-span-5 flex flex-col justify-between space-y-4 bg-surface/20">
          <div>
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-ink border border-line shadow-inner flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="h-full w-full object-cover"
              />

              {/* Status Badge on Video */}
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur px-2.5 py-0.5 text-[10px] font-medium text-white border border-white/10">
                <Camera className="h-3 w-3 text-signal" />
                <span>Camera Preview</span>
              </div>
            </div>

            {/* Legal & Consent Box */}
            <div className="mt-4 rounded-xl border border-line bg-panel p-3.5 shadow-sm text-xs text-ink-soft">
              <div className="flex items-center gap-1.5 font-semibold text-ink mb-1 text-[13px]">
                <ShieldCheck className="h-4 w-4 text-signal" />
                <span>Proctoring & Biometrics</span>
              </div>
              <p className="text-[11px] leading-relaxed text-ink-soft">
                Automated camera, voice detection, and browser telemetry ensure test integrity. Evidence is retained for 30 days and accessible only by evaluators.
              </p>
              <label className="mt-2.5 flex items-start gap-2.5 cursor-pointer font-medium text-ink bg-surface/70 p-2 rounded-lg border border-line/60">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="mt-0.5 rounded border-line text-signal focus:ring-signal"
                />
                <span className="text-[11px] leading-tight select-none">
                  I consent to automated proctoring & video/audio analysis.
                </span>
              </label>
            </div>
          </div>

          <div className="text-[11px] text-ink-soft/70 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-signal shrink-0" />
            <span>AI models run on-device for maximum privacy & low latency.</span>
          </div>
        </div>

        {/* ── Right Column: Checklist & Controls (7 cols) ───────── */}
        <div className="p-6 md:col-span-7 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-soft">
                System Diagnostics
              </h3>
              {running && (
                <span className="flex items-center gap-1 text-xs text-warn font-medium animate-pulse">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Running checks...
                </span>
              )}
            </div>

            {/* Steps list */}
            <ul className="divide-y divide-line/40 rounded-xl border border-line bg-panel p-1.5 max-h-[340px] overflow-y-auto">
              {steps.map((step) => (
                <StepRow
                  key={step.id}
                  step={step}
                  onRetry={() => void retryStep(step.id)}
                />
              ))}
            </ul>
          </div>

          {/* Action button area */}
          <div className="pt-2">
            {!running &&
              steps
                .filter((s) => s.id !== "recordingConsent")
                .every((step) => step.status === "pending") && (
                <button
                  type="button"
                  onClick={() => void start()}
                  disabled={!consentGiven}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-signal py-3 text-sm font-semibold text-white shadow-md shadow-signal/20 hover:bg-signal-strong disabled:cursor-not-allowed disabled:opacity-50 transition active:scale-[0.99]"
                >
                  <Sparkles className="h-4 w-4" />
                  {consentGiven ? "Run readiness checks" : "Grant consent to run checks"}
                </button>
              )}

            {!ready && otherRequiredStepsPassed && needsFullscreen && (
              <button
                type="button"
                onClick={() => void enterFullscreen()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-signal py-3 text-sm font-semibold text-white shadow-md shadow-signal/20 hover:bg-signal-strong transition active:scale-[0.99]"
              >
                <Maximize2 className="h-4 w-4" />
                Enter fullscreen to continue
              </button>
            )}

            {ready && (
              <button
                type="button"
                onClick={onReady}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-live py-3 text-sm font-bold text-white shadow-md shadow-live/25 hover:opacity-90 transition active:scale-[0.99]"
              >
                <Play className="h-4 w-4" />
                Begin interview
              </button>
            )}

            {failureReason && !ready && (
              <p className="mt-2 text-center text-xs font-medium text-danger">
                {failureReason}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
