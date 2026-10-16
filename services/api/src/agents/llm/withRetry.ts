export interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries `fn` with exponential backoff (baseDelayMs, then x2, x4, ...).
 * Only intended for transient failures (network errors, 5xx) - callers
 * should throw a non-retryable error type if a failure shouldn't be
 * retried (e.g. 401 invalid API key), though for simplicity every
 * provider client here currently retries on any thrown error up to
 * maxAttempts.
 */
export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions,
  onRetry?: (attempt: number, error: unknown) => void
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;

      const isLastAttempt = attempt === options.maxAttempts;

      if (isLastAttempt) break;

      onRetry?.(attempt, error);

      await sleep(options.baseDelayMs * 2 ** (attempt - 1));
    }
  }

  throw lastError;
}
