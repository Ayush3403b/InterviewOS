import { describe, expect, it, vi } from "vitest";

import { withRetry } from "../../../agents/llm/withRetry";

describe("withRetry", () => {

  it("returns the result on the first successful attempt without retrying", async () => {

    const fn = vi.fn().mockResolvedValue("ok");

    const result = await withRetry(fn, { maxAttempts: 3, baseDelayMs: 1 });

    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);

  });

  it("retries after a failure and succeeds on a later attempt", async () => {

    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("transient"))
      .mockResolvedValueOnce("ok");

    const result = await withRetry(fn, { maxAttempts: 3, baseDelayMs: 1 });

    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);

  });

  it("throws the last error once maxAttempts is exhausted", async () => {

    const fn = vi.fn().mockRejectedValue(new Error("always fails"));

    await expect(
      withRetry(fn, { maxAttempts: 3, baseDelayMs: 1 })
    ).rejects.toThrow("always fails");

    expect(fn).toHaveBeenCalledTimes(3);

  });

  it("calls onRetry once per failed attempt before the last", async () => {

    const fn = vi.fn().mockRejectedValue(new Error("fails"));
    const onRetry = vi.fn();

    await expect(
      withRetry(fn, { maxAttempts: 3, baseDelayMs: 1 }, onRetry)
    ).rejects.toThrow();

    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenNthCalledWith(1, 1, expect.any(Error));
    expect(onRetry).toHaveBeenNthCalledWith(2, 2, expect.any(Error));

  });

});
