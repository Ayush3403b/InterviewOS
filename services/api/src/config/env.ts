import dotenv from "dotenv";

dotenv.config();

function required(key: string): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

/**
 * Flags an obviously-weak secret (too short, or one of the
 * placeholder values people paste in during a quick local setup and
 * then forget to change). Hard-fails in production so a weak secret
 * can never ship; only warns elsewhere so it doesn't break an
 * existing local dev/test setup that already has a short secret.
 */
function requiredSecret(key: string, minLength = 32): string {
  const value = required(key);
  const commonWeakValues = new Set([
    "secret",
    "password",
    "changeme",
    "your-secret-key",
    "jwt-secret",
  ]);

  const isWeak =
    value.length < minLength || commonWeakValues.has(value.toLowerCase());

  if (isWeak) {
    const message =
      `${key} looks weak (too short, or a common placeholder). ` +
      "Generate a real one with: openssl rand -hex 32";

    if (process.env.NODE_ENV === "production") {
      throw new Error(message);
    }

    console.warn(`[env] ${message}`);
  }

  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",

  PORT: Number(process.env.PORT ?? 5000),

  MONGO_URI: required("MONGO_URI"),

  JWT_SECRET: requiredSecret("JWT_SECRET"),

  JWT_EXPIRES_IN: required("JWT_EXPIRES_IN"),

  CLIENT_URL: required("CLIENT_URL"),

  SMTP_HOST: required("SMTP_HOST"),

  SMTP_PORT: Number(required("SMTP_PORT")),

  SMTP_USER: required("SMTP_USER"),

  SMTP_PASS: required("SMTP_PASS"),

  MAIL_FROM: required("MAIL_FROM"),

  /**
   * Which AI provider generates evaluations: "claude" | "openai" | "gemini" | "mock".
   * Only the selected provider's API key below needs to be set.
   */
  AI_EVALUATION_PROVIDER: process.env.AI_EVALUATION_PROVIDER ?? "mock",

  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",

  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL ?? "gpt-4o-mini",

  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",

  /**
   * Comma-separated ordered fallback chain, e.g. "openai,gemini".
   * If the primary provider fails (after its own retries), each of
   * these is tried in order before giving up entirely.
   */
  AI_FALLBACK_PROVIDERS: process.env.AI_FALLBACK_PROVIDERS ?? "",

  /** Network-level retries per provider call (transient failures). */
  AI_RETRY_MAX_ATTEMPTS: Number(process.env.AI_RETRY_MAX_ATTEMPTS ?? 3),
  AI_RETRY_BASE_DELAY_MS: Number(
    process.env.AI_RETRY_BASE_DELAY_MS ?? 500
  ),

  /**
   * Full generate+validate cycles to retry when the model's response
   * fails schema validation (distinct from network retries above).
   */
  AI_VALIDATION_RETRY_ATTEMPTS: Number(
    process.env.AI_VALIDATION_RETRY_ATTEMPTS ?? 2
  ),

  /**
   * "recaptcha" | "hcaptcha" | "none". Defaults to "none" (no
   * verification at all) so local dev/CI/test never need a real
   * site/secret key pair - same spirit as AI_EVALUATION_PROVIDER's
   * "mock" default. Set a real provider + CAPTCHA_SECRET_KEY before
   * exposing registration/login to the public internet.
   */
  CAPTCHA_PROVIDER: process.env.CAPTCHA_PROVIDER ?? "none",
  CAPTCHA_SECRET_KEY: process.env.CAPTCHA_SECRET_KEY,

  /**
   * How long an IN_PROGRESS interview can go without activity before
   * it's treated as abandoned and auto-expired (see InterviewStatus.EXPIRED).
   */
  INTERVIEW_IN_PROGRESS_TIMEOUT_MINUTES: Number(
    process.env.INTERVIEW_IN_PROGRESS_TIMEOUT_MINUTES ?? 60
  ),

  /** Same idea, for a PAUSED interview that's never resumed. */
  INTERVIEW_PAUSED_TIMEOUT_HOURS: Number(
    process.env.INTERVIEW_PAUSED_TIMEOUT_HOURS ?? 24
  ),
};