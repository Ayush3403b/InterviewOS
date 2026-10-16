/**
 * A minimal in-memory rate limiter for contexts `express-rate-limit`
 * doesn't cover - specifically, the Socket.IO `proctoring:signal`
 * handler, which is the *primary* signal-ingestion transport (the
 * REST route in ProctoringRoutes.ts is the fallback, and does use
 * express-rate-limit - see rateLimit.middleware.ts).
 *
 * Deliberately simple: a per-key sliding window counted via
 * timestamps, not a token bucket or a distributed store. That's the
 * right tradeoff for a single-process deployment; if this API ever
 * runs multiple instances behind a load balancer, swap the backing
 * store for something shared (Redis) rather than trusting each
 * instance's own in-memory counts - noted here so it isn't a silent
 * gap later.
 */
export class SlidingWindowRateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly windowMs: number,
    private readonly maxHits: number
  ) {}

  /** Records one hit for `key` and returns whether it's within limit. */
  consume(key: string): boolean {
    const now = Date.now();
    const cutoff = now - this.windowMs;

    const existing = this.hits.get(key) ?? [];
    const recent = existing.filter((timestamp) => timestamp > cutoff);

    if (recent.length >= this.maxHits) {
      this.hits.set(key, recent);
      return false;
    }

    recent.push(now);
    this.hits.set(key, recent);
    return true;
  }

  /** Drops keys with no hits inside the window - call periodically to
   *  bound memory on a long-running process with many distinct keys. */
  sweep(): void {
    const cutoff = Date.now() - this.windowMs;
    for (const [key, timestamps] of this.hits) {
      const recent = timestamps.filter((timestamp) => timestamp > cutoff);
      if (recent.length === 0) {
        this.hits.delete(key);
      } else {
        this.hits.set(key, recent);
      }
    }
  }
}
