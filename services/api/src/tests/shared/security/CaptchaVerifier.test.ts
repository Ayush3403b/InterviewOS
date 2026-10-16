import { afterEach, describe, expect, it, vi } from "vitest";

async function loadVerifier(envOverrides: Record<string, unknown>) {
  vi.resetModules();

  vi.doMock("../../../config/env", () => ({
    env: {
      CAPTCHA_PROVIDER: "none",
      CAPTCHA_SECRET_KEY: undefined,
      ...envOverrides,
    },
  }));

  return import("../../../shared/security/CaptchaVerifier.js");
}

describe("verifyCaptcha", () => {

  afterEach(() => {
    vi.doUnmock("../../../config/env");
    vi.unstubAllGlobals();
  });

  it("always passes when the provider is 'none', even with no token", async () => {

    const { verifyCaptcha } = await loadVerifier({ CAPTCHA_PROVIDER: "none" });

    expect(await verifyCaptcha(undefined)).toBe(true);

  });

  it("fails closed when a provider is set but no token was sent", async () => {

    const { verifyCaptcha } = await loadVerifier({
      CAPTCHA_PROVIDER: "recaptcha",
      CAPTCHA_SECRET_KEY: "test-secret",
    });

    expect(await verifyCaptcha(undefined)).toBe(false);

  });

  it("fails closed when a provider is set but the secret key is missing (misconfiguration)", async () => {

    const { verifyCaptcha } = await loadVerifier({
      CAPTCHA_PROVIDER: "recaptcha",
      CAPTCHA_SECRET_KEY: undefined,
    });

    expect(await verifyCaptcha("some-token")).toBe(false);

  });

  it("passes when the provider confirms success", async () => {

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })
    );

    const { verifyCaptcha } = await loadVerifier({
      CAPTCHA_PROVIDER: "hcaptcha",
      CAPTCHA_SECRET_KEY: "test-secret",
    });

    expect(await verifyCaptcha("valid-token")).toBe(true);

  });

  it("fails when the provider reports success:false", async () => {

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: false, "error-codes": ["invalid-input-response"] }),
      })
    );

    const { verifyCaptcha } = await loadVerifier({
      CAPTCHA_PROVIDER: "recaptcha",
      CAPTCHA_SECRET_KEY: "test-secret",
    });

    expect(await verifyCaptcha("bad-token")).toBe(false);

  });

  it("rejects a low reCAPTCHA v3 score even when success is true", async () => {

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, score: 0.1 }),
      })
    );

    const { verifyCaptcha } = await loadVerifier({
      CAPTCHA_PROVIDER: "recaptcha",
      CAPTCHA_SECRET_KEY: "test-secret",
    });

    expect(await verifyCaptcha("bot-like-token")).toBe(false);

  });

  it("accepts a high reCAPTCHA v3 score", async () => {

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, score: 0.9 }),
      })
    );

    const { verifyCaptcha } = await loadVerifier({
      CAPTCHA_PROVIDER: "recaptcha",
      CAPTCHA_SECRET_KEY: "test-secret",
    });

    expect(await verifyCaptcha("human-token")).toBe(true);

  });

  it("fails closed when the verify request itself errors", async () => {

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const { verifyCaptcha } = await loadVerifier({
      CAPTCHA_PROVIDER: "recaptcha",
      CAPTCHA_SECRET_KEY: "test-secret",
    });

    expect(await verifyCaptcha("some-token")).toBe(false);

  });

  it("fails closed on a non-2xx response from the provider", async () => {

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503 })
    );

    const { verifyCaptcha } = await loadVerifier({
      CAPTCHA_PROVIDER: "hcaptcha",
      CAPTCHA_SECRET_KEY: "test-secret",
    });

    expect(await verifyCaptcha("some-token")).toBe(false);

  });

});
