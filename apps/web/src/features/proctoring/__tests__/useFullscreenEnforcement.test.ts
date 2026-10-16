import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useFullscreenEnforcement } from "../useFullscreenEnforcement";

/** Simulates the browser entering/leaving fullscreen. */
function setFullscreen(active: boolean) {
  Object.defineProperty(document, "fullscreenElement", {
    configurable: true,
    value: active ? document.documentElement : null,
  });
  document.dispatchEvent(new Event("fullscreenchange"));
}

describe("useFullscreenEnforcement", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setFullscreen(true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts a grace countdown on exit and clears it on return", () => {
    const onLimitReached = vi.fn();
    const { result } = renderHook(() =>
      useFullscreenEnforcement({ enabled: true, onLimitReached, sessionLabel: "test" })
    );

    act(() => setFullscreen(false));
    expect(result.current.warningActive).toBe(true);
    expect(result.current.exitCount).toBe(1);

    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.countdown).toBe(3);

    act(() => setFullscreen(true));
    expect(result.current.warningActive).toBe(false);
    expect(onLimitReached).not.toHaveBeenCalled();
  });

  it("ends the session when the grace period runs out", () => {
    const onLimitReached = vi.fn();
    const { result } = renderHook(() =>
      useFullscreenEnforcement({ enabled: true, onLimitReached, sessionLabel: "test" })
    );

    act(() => setFullscreen(false));
    act(() => vi.advanceTimersByTime(6000));

    expect(onLimitReached).toHaveBeenCalledTimes(1);
    expect(onLimitReached.mock.calls[0][0]).toMatch(/grace period expired.*test/i);
    expect(result.current.terminationReason).not.toBeNull();
  });

  it("ends the session on the exit after the allowed number", () => {
    const onLimitReached = vi.fn();
    renderHook(() =>
      useFullscreenEnforcement({
        enabled: true,
        onLimitReached,
        sessionLabel: "interview",
        maxExits: 2,
      })
    );

    for (let exit = 0; exit < 2; exit++) {
      act(() => setFullscreen(false));
      act(() => setFullscreen(true));
    }
    expect(onLimitReached).not.toHaveBeenCalled();

    act(() => setFullscreen(false));
    expect(onLimitReached).toHaveBeenCalledTimes(1);
    expect(onLimitReached.mock.calls[0][0]).toMatch(/exit limit.*interview/i);
  });

  it("ignores exits while disabled (e.g. while submitting)", () => {
    const onLimitReached = vi.fn();
    const { result } = renderHook(() =>
      useFullscreenEnforcement({ enabled: false, onLimitReached, sessionLabel: "test" })
    );

    act(() => setFullscreen(false));

    expect(result.current.exitCount).toBe(0);
    expect(result.current.warningActive).toBe(false);
  });
});
