import { useEffect, useState } from "react";

/**
 * Milliseconds left until `deadlineAt`, ticking twice a second.
 * `serverNow` (sent with the attempt) corrects for the candidate's
 * clock being off - the server enforces the deadline either way, this
 * just keeps the countdown honest.
 */
export function useCountdown(deadlineAt: string, serverNow: string): number {
  const [clockOffsetMs] = useState(() => Date.parse(serverNow) - Date.now());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(intervalId);
  }, []);

  return Math.max(0, Date.parse(deadlineAt) - (now + clockOffsetMs));
}

export function formatRemaining(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mmss = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return hours > 0 ? `${hours}:${mmss}` : mmss;
}
