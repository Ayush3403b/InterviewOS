import { useEffect, useEffectEvent, useState } from "react";

import { isFullscreenActive, requestFullscreen } from "./deviceChecks";

export const DEFAULT_MAX_FULLSCREEN_EXITS = 2;
export const DEFAULT_FULLSCREEN_GRACE_SECONDS = 5;

export interface UseFullscreenEnforcementOptions {
  /**
   * Whether exits currently count. Turn this off once the session is
   * ending (submitting, generating results) so leaving fullscreen
   * then isn't a violation.
   */
  enabled: boolean;
  /**
   * Called once the candidate exceeds the allowed exits or lets the
   * grace countdown run out - submit the session here.
   */
  onLimitReached: (reason: string) => void;
  /** "interview" | "test" - used in the messages shown to the candidate. */
  sessionLabel: string;
  maxExits?: number;
  graceSeconds?: number;
}

export interface FullscreenEnforcementState {
  exitCount: number;
  maxExits: number;
  graceSeconds: number;
  /** A countdown is running - show the warning overlay. */
  warningActive: boolean;
  countdown: number;
  /** Why the session was auto-submitted, once it has been. */
  terminationReason: string | null;
  returnToFullscreen: () => Promise<void>;
}

/**
 * Fullscreen rules for a proctored session: each exit starts a short
 * grace countdown to get back in; running out of exits, or out of
 * time on the countdown, ends the session via `onLimitReached`.
 */
export function useFullscreenEnforcement({
  enabled,
  onLimitReached,
  sessionLabel,
  maxExits = DEFAULT_MAX_FULLSCREEN_EXITS,
  graceSeconds = DEFAULT_FULLSCREEN_GRACE_SECONDS,
}: UseFullscreenEnforcementOptions): FullscreenEnforcementState {
  const [exitCount, setExitCount] = useState(0);
  const [warningActive, setWarningActive] = useState(false);
  const [countdown, setCountdown] = useState(graceSeconds);
  const [terminationReason, setTerminationReason] = useState<string | null>(null);

  const terminate = useEffectEvent((reason: string) => {
    setWarningActive(false);
    setTerminationReason(reason);
    onLimitReached(reason);
  });

  const handleFullscreenChange = useEffectEvent(() => {
    if (!enabled || terminationReason) {
      return;
    }

    if (isFullscreenActive()) {
      setWarningActive(false);
      return;
    }

    const nextCount = exitCount + 1;
    setExitCount(nextCount);

    if (nextCount > maxExits) {
      terminate(
        `Maximum fullscreen exit limit reached (${maxExits}/${maxExits}). Your ${sessionLabel} has been auto-submitted.`
      );
      return;
    }

    setCountdown(graceSeconds);
    setWarningActive(true);
  });

  useEffect(() => {
    const listener = () => handleFullscreenChange();

    document.addEventListener("fullscreenchange", listener);
    document.addEventListener("webkitfullscreenchange", listener);

    return () => {
      document.removeEventListener("fullscreenchange", listener);
      document.removeEventListener("webkitfullscreenchange", listener);
    };
  }, []);

  const onTick = useEffectEvent((remaining: number) => {
    // The session started ending mid-countdown - drop the warning.
    if (!enabled) {
      setWarningActive(false);
      return;
    }

    setCountdown(Math.max(0, remaining));

    if (remaining <= 0) {
      terminate(
        `Fullscreen grace period expired (${graceSeconds} seconds). Your ${sessionLabel} has been auto-submitted.`
      );
    }
  });

  useEffect(() => {
    if (!warningActive) {
      return;
    }

    // Counted here rather than read back from state, so two ticks
    // landing before a re-render can't count as one.
    let remaining = graceSeconds;

    const intervalId = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(intervalId);
      }
      onTick(remaining);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [warningActive, graceSeconds]);

  const returnToFullscreen = async () => {
    try {
      await requestFullscreen();
    } catch {
      // Browser refused (no user gesture, policy) - the overlay stays up.
    }
  };

  return {
    exitCount,
    maxExits,
    graceSeconds,
    warningActive: warningActive && enabled,
    countdown,
    terminationReason,
    returnToFullscreen,
  };
}
