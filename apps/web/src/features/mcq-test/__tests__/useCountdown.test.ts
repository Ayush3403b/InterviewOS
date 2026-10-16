import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { formatRemaining, useCountdown } from "../useCountdown";

describe("formatRemaining", () => {
  it("formats minutes and seconds, adding hours only when needed", () => {
    expect(formatRemaining(65_000)).toBe("01:05");
    expect(formatRemaining(0)).toBe("00:00");
    expect(formatRemaining(3_725_000)).toBe("1:02:05");
  });

  it("rounds partial seconds up so 00:00 only shows at the deadline", () => {
    expect(formatRemaining(400)).toBe("00:01");
  });
});

describe("useCountdown", () => {
  afterEach(() => vi.useRealTimers());

  it("corrects for a client clock that's ahead of the server", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T10:05:00Z")); // client is 5 min fast

    const serverNow = "2026-01-01T10:00:00Z";
    const deadline = "2026-01-01T10:10:00Z";

    const { result } = renderHook(() => useCountdown(deadline, serverNow));
    expect(result.current).toBe(10 * 60_000);

    act(() => vi.advanceTimersByTime(60_000));
    expect(result.current).toBe(9 * 60_000);
  });

  it("never goes below zero", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T10:00:00Z"));

    const { result } = renderHook(() =>
      useCountdown("2026-01-01T09:00:00Z", "2026-01-01T10:00:00Z")
    );

    expect(result.current).toBe(0);
  });
});
