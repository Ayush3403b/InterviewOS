import { useEffect, useRef } from "react";

/** A click rate above this within the rolling window counts as "rapid". */
const RAPID_CLICK_COUNT = 8;
const RAPID_CLICK_WINDOW_MS = 2000;

export interface BehaviorSnapshot {
  /** Cumulative ms since the last mouse/keyboard activity. */
  idleDurationMs: number;
  /** True for the tick(s) right after a rapid-clicking burst is detected. */
  rapidClickingDetected: boolean;
}

/**
 * Tracks mouse/keyboard liveness so `useProctoring` can report idle
 * time and unusually rapid clicking alongside its other continuous
 * signals. Zero-dependency - just DOM listeners and timestamps.
 */
export function useBehaviorMonitoring() {
  const snapshotRef = useRef<BehaviorSnapshot>({
    idleDurationMs: 0,
    rapidClickingDetected: false,
  });

  const lastActivityRef = useRef(0);
  const clickTimestampsRef = useRef<number[]>([]);

  useEffect(() => {
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    const markActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const handleClick = () => {
      markActivity();
      const now = Date.now();
      const timestamps = clickTimestampsRef.current.filter(
        (t) => now - t < RAPID_CLICK_WINDOW_MS
      );
      timestamps.push(now);
      clickTimestampsRef.current = timestamps;
      snapshotRef.current.rapidClickingDetected = timestamps.length >= RAPID_CLICK_COUNT;
    };

    window.addEventListener("mousemove", markActivity);
    window.addEventListener("keydown", markActivity);
    window.addEventListener("scroll", markActivity);
    window.addEventListener("click", handleClick);

    const intervalId = setInterval(() => {
      snapshotRef.current.idleDurationMs = Date.now() - lastActivityRef.current;

      // Let a rapid-clicking flag clear once the burst has aged out
      // of the rolling window, rather than sticking forever.
      const now = Date.now();
      const stillRecent = clickTimestampsRef.current.some(
        (t) => now - t < RAPID_CLICK_WINDOW_MS
      );
      if (!stillRecent) {
        snapshotRef.current.rapidClickingDetected = false;
      }
    }, 1000);

    return () => {
      window.removeEventListener("mousemove", markActivity);
      window.removeEventListener("keydown", markActivity);
      window.removeEventListener("scroll", markActivity);
      window.removeEventListener("click", handleClick);
      clearInterval(intervalId);
    };
  }, []);

  return { snapshotRef };
}
