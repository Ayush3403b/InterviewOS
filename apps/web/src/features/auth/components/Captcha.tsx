import { useEffect, useRef } from "react";

/**
 * Minimal ambient typing for the bits of the reCAPTCHA global API this
 * component actually uses - not a full @types/grecaptcha, since
 * that's not installed and this is all that's needed.
 */
declare global {
  interface Window {
    grecaptcha?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => number;
      reset: (widgetId?: number) => void;
    };
  }
}

const SCRIPT_SRC = "https://www.google.com/recaptcha/api.js?render=explicit";
let scriptLoadPromise: Promise<void> | null = null;

function loadRecaptchaScript(): Promise<void> {
  if (window.grecaptcha) {
    return Promise.resolve();
  }

  if (!scriptLoadPromise) {
    scriptLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptLoadPromise = null;
        reject(new Error("Failed to load the CAPTCHA script."));
      };
      document.head.appendChild(script);
    });
  }

  return scriptLoadPromise;
}

export interface CaptchaProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
}

/**
 * Renders a reCAPTCHA v2 checkbox widget, or nothing at all if
 * `VITE_CAPTCHA_SITE_KEY` isn't set - matching the backend's
 * CAPTCHA_PROVIDER=none default, this component is a silent no-op
 * (calling `onVerify("")` once so the form isn't stuck waiting) when
 * CAPTCHA isn't configured, so local dev never needs a real site key.
 *
 * Uses the plain reCAPTCHA JS API loaded dynamically at runtime,
 * not an npm package - one less dependency to install/verify for
 * something this small.
 */
export function Captcha({ onVerify, onExpire }: CaptchaProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hasRenderedRef = useRef(false);

  const siteKey = import.meta.env.VITE_CAPTCHA_SITE_KEY as string | undefined;

  useEffect(() => {
    if (!siteKey) {
      onVerify("");
      return;
    }

    if (!containerRef.current || hasRenderedRef.current) {
      return;
    }

    let cancelled = false;

    loadRecaptchaScript()
      .then(() => {
        if (cancelled || !containerRef.current || hasRenderedRef.current) {
          return;
        }
        hasRenderedRef.current = true;

        window.grecaptcha?.render(containerRef.current, {
          sitekey: siteKey,
          callback: onVerify,
          "expired-callback": onExpire,
        });
      })
      .catch((error) => {
        console.warn("[captcha]", error);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  if (!siteKey) {
    return null;
  }

  return <div ref={containerRef} className="my-1" />;
}
