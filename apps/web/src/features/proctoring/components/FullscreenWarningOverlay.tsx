import { AlertTriangle, Maximize2, ShieldAlert, Timer } from "lucide-react";

import type { FullscreenEnforcementState } from "../useFullscreenEnforcement";

interface FullscreenWarningOverlayProps {
  enforcement: FullscreenEnforcementState;
  /** "interview" | "test" - used in the copy. */
  sessionLabel: string;
}

/** The blocking "get back into fullscreen" countdown shown after an exit. */
export function FullscreenWarningOverlay({
  enforcement,
  sessionLabel,
}: FullscreenWarningOverlayProps) {
  const { warningActive, exitCount, maxExits, countdown, graceSeconds } = enforcement;

  if (!warningActive) {
    return null;
  }

  const capitalized = sessionLabel.charAt(0).toUpperCase() + sessionLabel.slice(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border-2 border-danger/80 bg-panel p-6 shadow-2xl text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-danger/15 text-danger animate-bounce">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-danger/10 px-3 py-1 text-xs font-bold text-danger mb-2">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>
              VIOLATION: Exit {exitCount} of {maxExits}
            </span>
          </div>
          <h2 className="font-display text-xl font-bold text-ink">
            Fullscreen Mode Exited!
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Leaving fullscreen is prohibited during this proctored {sessionLabel}.
            You must return to fullscreen immediately.
          </p>
        </div>

        <div className="rounded-xl border border-danger/30 bg-danger/5 p-4">
          <div className="flex items-center justify-center gap-2 text-danger font-mono text-3xl font-black">
            <Timer className="h-7 w-7 animate-spin" />
            <span>00:{String(countdown).padStart(2, "0")}</span>
          </div>
          <p className="mt-1 text-xs font-semibold text-danger/90">
            {capitalized} will be AUTO-SUBMITTED in {countdown} second
            {countdown !== 1 ? "s" : ""}
          </p>

          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-line">
            <div
              className="h-full bg-danger transition-all duration-1000 ease-linear"
              style={{ width: `${(countdown / graceSeconds) * 100}%` }}
            />
          </div>
        </div>

        <p className="text-xs text-ink-soft">
          {exitCount >= maxExits ? (
            <span className="text-danger font-bold">
              ⚠️ This is your LAST warning. Next exit terminates session immediately.
            </span>
          ) : (
            <span>
              Allowed exits remaining: <strong>{maxExits - exitCount}</strong>
            </span>
          )}
        </p>

        <button
          type="button"
          onClick={() => void enforcement.returnToFullscreen()}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-danger py-3.5 text-base font-bold text-white shadow-lg shadow-danger/30 hover:bg-danger/90 transition active:scale-95"
        >
          <Maximize2 className="h-5 w-5" />
          Return to Fullscreen Now ({countdown}s)
        </button>
      </div>
    </div>
  );
}
