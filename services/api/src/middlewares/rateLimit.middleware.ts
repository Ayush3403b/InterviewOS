import rateLimit from "express-rate-limit";
import type { NextFunction, Request, Response } from "express";

import { AuthenticatedRequest } from "../shared/security/AuthenticatedRequest";
import { ApiError } from "../shared/errors/ApiError";
import { ErrorCode } from "../shared/errors/ErrorCode";

/**
 * ================================================================
 * Rate limiting
 * ================================================================
 *
 * Three tiers, from strictest to loosest:
 *
 *  1. `authRateLimiter` - login/register/password-reset/verification.
 *     These run *before* a user is authenticated, so they're keyed by
 *     IP. Deliberately strict - this is the credential-stuffing and
 *     account-enumeration surface.
 *  2. `signalRateLimiter` - the proctoring REST signal endpoint,
 *     which is a *fallback* for the socket path (see gateway.ts for
 *     the socket-level limiter - Express middleware doesn't apply to
 *     Socket.IO connections, so that one is separate). Keyed by user,
 *     since it only runs after authMiddleware. Sized generously above
 *     the client's real ~3s tick cadence.
 *  3. `apiRateLimiter` - a loose baseline applied to everything under
 *     `/api/v1`, mainly to blunt basic scripted abuse/DoS rather than
 *     to shape legitimate traffic.
 *
 * All three return the same error envelope every other error in this
 * app uses (see error.middleware.ts), so clients don't need special-
 * case handling for a 429.
 */

function rateLimitHandler(_req: Request, _res: Response, next: NextFunction) {
  next(
    new ApiError(
      429,
      "Too many requests. Please slow down and try again shortly.",
      ErrorCode.TOO_MANY_REQUESTS
    )
  );
}

/** Falls back to the connection's IP if a proxy didn't set one - same
 *  default express-rate-limit would use, made explicit for clarity. */
function ipKey(req: Request): string {
  return req.ip ?? req.socket.remoteAddress ?? "unknown";
}

function userKey(req: Request): string {
  const userId = (req as AuthenticatedRequest).user?.sub;
  return userId ?? ipKey(req);
}

const AUTH_WINDOW_MS = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000);
const AUTH_MAX = Number(process.env.AUTH_RATE_LIMIT_MAX ?? 10);

export const authRateLimiter = rateLimit({
  windowMs: AUTH_WINDOW_MS,
  limit: AUTH_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKey,
  handler: rateLimitHandler,
});

const SIGNAL_WINDOW_MS = Number(process.env.SIGNAL_RATE_LIMIT_WINDOW_MS ?? 10 * 1000);
const SIGNAL_MAX = Number(process.env.SIGNAL_RATE_LIMIT_MAX ?? 20);

export const signalRateLimiter = rateLimit({
  windowMs: SIGNAL_WINDOW_MS,
  limit: SIGNAL_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKey,
  handler: rateLimitHandler,
});

const API_WINDOW_MS = Number(process.env.API_RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000);
const API_MAX = Number(process.env.API_RATE_LIMIT_MAX ?? 600);

export const apiRateLimiter = rateLimit({
  windowMs: API_WINDOW_MS,
  limit: API_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKey,
  handler: rateLimitHandler,
});

const RESUME_WRITER_WINDOW_MS = Number(
  process.env.RESUME_WRITER_RATE_LIMIT_WINDOW_MS ?? 5 * 60 * 1000
);
const RESUME_WRITER_MAX = Number(process.env.RESUME_WRITER_RATE_LIMIT_MAX ?? 15);

/**
 * Grammar-check/rewrite hit an LLM per call (in LLM mode) - a tighter
 * limit than the general API baseline, purely to bound cost from a
 * runaway client, not because the feature itself is sensitive.
 */
export const resumeWriterRateLimiter = rateLimit({
  windowMs: RESUME_WRITER_WINDOW_MS,
  limit: RESUME_WRITER_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKey,
  handler: rateLimitHandler,
});

const MCQ_GENERATION_WINDOW_MS = Number(
  process.env.MCQ_GENERATION_RATE_LIMIT_WINDOW_MS ?? 10 * 60 * 1000
);
const MCQ_GENERATION_MAX = Number(process.env.MCQ_GENERATION_RATE_LIMIT_MAX ?? 20);

/**
 * AI question generation is the most expensive call in the app (a
 * large batch of output, sometimes with images/PDFs as input) - same
 * reasoning as resumeWriterRateLimiter, sized for an author building a
 * test in a few rounds.
 */
export const mcqGenerationRateLimiter = rateLimit({
  windowMs: MCQ_GENERATION_WINDOW_MS,
  limit: MCQ_GENERATION_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKey,
  handler: rateLimitHandler,
});
