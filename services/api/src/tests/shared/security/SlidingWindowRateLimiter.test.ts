import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SlidingWindowRateLimiter } from "../../../shared/security/SlidingWindowRateLimiter";

describe("SlidingWindowRateLimiter", () => {

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows hits up to the limit within the window", () => {

    const limiter = new SlidingWindowRateLimiter(10_000, 3);

    expect(limiter.consume("user-1")).toBe(true);
    expect(limiter.consume("user-1")).toBe(true);
    expect(limiter.consume("user-1")).toBe(true);

  });

  it("rejects hits past the limit within the same window", () => {

    const limiter = new SlidingWindowRateLimiter(10_000, 3);

    limiter.consume("user-1");
    limiter.consume("user-1");
    limiter.consume("user-1");

    expect(limiter.consume("user-1")).toBe(false);

  });

  it("tracks separate keys independently", () => {

    const limiter = new SlidingWindowRateLimiter(10_000, 1);

    expect(limiter.consume("user-1")).toBe(true);
    expect(limiter.consume("user-1")).toBe(false);
    expect(limiter.consume("user-2")).toBe(true);

  });

  it("allows hits again once the window has fully elapsed", () => {

    const limiter = new SlidingWindowRateLimiter(10_000, 1);

    expect(limiter.consume("user-1")).toBe(true);
    expect(limiter.consume("user-1")).toBe(false);

    vi.advanceTimersByTime(10_001);

    expect(limiter.consume("user-1")).toBe(true);

  });

  it("only counts hits still inside the rolling window, not stale ones", () => {

    const limiter = new SlidingWindowRateLimiter(10_000, 2);

    limiter.consume("user-1");
    vi.advanceTimersByTime(9_000);
    limiter.consume("user-1");

    // First hit is now 9s old (still in window), so this is the 3rd
    // hit inside the last 10s - should be rejected.
    expect(limiter.consume("user-1")).toBe(false);

    // Advance past the first hit's expiry (it was at t=0, window=10s).
    vi.advanceTimersByTime(1_001);

    // Only the t=9000 hit remains in-window now - room for one more.
    expect(limiter.consume("user-1")).toBe(true);

  });

  describe("sweep", () => {

    it("removes keys with no hits left in the window", () => {

      const limiter = new SlidingWindowRateLimiter(10_000, 5);

      limiter.consume("stale-user");
      vi.advanceTimersByTime(10_001);

      limiter.sweep();

      // If the stale entry was really cleared, this key starts fresh
      // and a full new burst up to the limit should succeed.
      for (let i = 0; i < 5; i += 1) {
        expect(limiter.consume("stale-user")).toBe(true);
      }

    });

    it("keeps keys that still have hits inside the window", () => {

      const limiter = new SlidingWindowRateLimiter(10_000, 1);

      limiter.consume("active-user");
      limiter.sweep();

      expect(limiter.consume("active-user")).toBe(false);

    });

  });

});
