import { env } from "../../config/env";
import { logger } from "../logger/logger";

export type CaptchaProvider = "recaptcha" | "hcaptcha" | "none";

const VERIFY_URLS: Record<Exclude<CaptchaProvider, "none">, string> = {
  recaptcha: "https://www.google.com/recaptcha/api/siteverify",
  hcaptcha: "https://hcaptcha.com/siteverify",
};

interface ProviderVerifyResponse {
  success: boolean;
  score?: number;
  "error-codes"?: string[];
}

/**
 * Verifies a CAPTCHA token against whichever provider is configured
 * (`CAPTCHA_PROVIDER` in .env). Both reCAPTCHA and hCaptcha's verify
 * APIs share the same request/response shape, so one implementation
 * covers both.
 *
 * When `CAPTCHA_PROVIDER` is "none" (the default), this always
 * returns true without making any network call - the same
 * "mock provider" pattern used for the AI evaluation providers, so
 * local dev/CI/test never need a real site/secret key pair.
 */
export async function verifyCaptcha(
  token: string | undefined,
  remoteIp?: string
): Promise<boolean> {
  const provider = env.CAPTCHA_PROVIDER as CaptchaProvider;

  if (provider === "none") {
    return true;
  }

  if (!token) {
    return false;
  }

  if (!env.CAPTCHA_SECRET_KEY) {
    // Misconfiguration (a provider is set but no secret key) - fail
    // closed rather than silently letting every request through.
    logger.warn(
      `CAPTCHA_PROVIDER=${provider} but CAPTCHA_SECRET_KEY is not set - rejecting.`
    );
    return false;
  }

  try {
    const body = new URLSearchParams({
      secret: env.CAPTCHA_SECRET_KEY,
      response: token,
    });
    if (remoteIp) {
      body.set("remoteip", remoteIp);
    }

    const response = await fetch(VERIFY_URLS[provider], {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!response.ok) {
      logger.warn(
        `CAPTCHA verification request failed: HTTP ${response.status}`
      );
      return false;
    }

    const result = (await response.json()) as ProviderVerifyResponse;

    if (!result.success) {
      return false;
    }

    // reCAPTCHA v3 returns a 0-1 risk score on top of `success`;
    // v2 (checkbox) omits it entirely. Only gate on it when present.
    if (typeof result.score === "number" && result.score < 0.5) {
      return false;
    }

    return true;
  } catch (error) {
    logger.warn(
      `CAPTCHA verification errored, failing closed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return false;
  }
}
