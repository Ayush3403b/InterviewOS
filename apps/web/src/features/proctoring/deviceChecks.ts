import { API_URL } from "../../lib/apiClient";

export interface CompatibilityCheckResult {
  passed: boolean;
  message: string;
}

/**
 * Narrow type for the non-standard (Chromium-only) Network
 * Information API - guarded behind a runtime check everywhere it's
 * used, never assumed to exist.
 */
interface NetworkInformationLike {
  effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
  downlink?: number;
  saveData?: boolean;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformationLike;
}

/**
 * Verifies the handful of Web APIs everything else in this checklist
 * depends on. Fails fast with a clear reason instead of letting a
 * later step fail confusingly (e.g. "camera permission denied" on a
 * browser that never supported getUserMedia in the first place).
 */
export function checkBrowserCompatibility(): CompatibilityCheckResult {
  const missing: string[] = [];

  if (!navigator.mediaDevices?.getUserMedia) {
    missing.push("camera/microphone access (getUserMedia)");
  }

  if (typeof WebAssembly === "undefined") {
    missing.push("WebAssembly (required for on-device AI models)");
  }

  if (!document.fullscreenEnabled && !("webkitFullscreenEnabled" in document)) {
    missing.push("Fullscreen API");
  }

  if (missing.length > 0) {
    return {
      passed: false,
      message: `This browser is missing: ${missing.join(", ")}. Please use a recent version of Chrome, Edge, or Firefox.`,
    };
  }

  return { passed: true, message: "Browser supports all required features." };
}

/**
 * Confirms at least one camera and one microphone are present on
 * the device. This is a device-inventory check, distinct from
 * whether the candidate has *granted permission* to use them -
 * `enumerateDevices()` still reports device presence (with blank
 * labels) even before permission is granted, in every major browser.
 */
export async function checkDeviceCompatibility(): Promise<CompatibilityCheckResult> {
  if (!navigator.mediaDevices?.enumerateDevices) {
    return {
      passed: false,
      message: "This browser can't list media devices.",
    };
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasCamera = devices.some((device) => device.kind === "videoinput");
    const hasMic = devices.some((device) => device.kind === "audioinput");

    if (!hasCamera && !hasMic) {
      return { passed: false, message: "No camera or microphone was found on this device." };
    }
    if (!hasCamera) {
      return { passed: false, message: "No camera was found on this device." };
    }
    if (!hasMic) {
      return { passed: false, message: "No microphone was found on this device." };
    }

    return { passed: true, message: "Camera and microphone detected." };
  } catch {
    return { passed: false, message: "Could not check for a camera or microphone." };
  }
}

/**
 * Best-effort connection-quality check. There is no standard,
 * cross-browser bandwidth-measurement API, so this uses two
 * fallbacks in order:
 *  1. The (Chromium-only) Network Information API, if present.
 *  2. Otherwise, times a request to the API's health endpoint and
 *     classifies by round-trip latency. This measures latency, not
 *     throughput - a reasonable proxy for "will a live interview
 *     feel responsive", not a real speed test.
 */
export async function checkInternetQuality(): Promise<CompatibilityCheckResult> {
  const nav = navigator as NavigatorWithConnection;

  if (nav.connection?.effectiveType) {
    const { effectiveType, downlink } = nav.connection;

    if (effectiveType === "slow-2g" || effectiveType === "2g") {
      return {
        passed: false,
        message: "Your connection looks too slow for a smooth live interview.",
      };
    }

    return {
      passed: true,
      message: downlink
        ? `Connection looks good (~${downlink} Mbps).`
        : "Connection looks good.",
    };
  }

  try {
    const startedAt = performance.now();

    const response = await fetch(`${API_URL}/api/v1/health`, {
      cache: "no-store",
    });

    const latencyMs = performance.now() - startedAt;

    if (!response.ok) {
      return { passed: false, message: "Could not reach the server to check your connection." };
    }

    if (latencyMs > 1500) {
      return {
        passed: false,
        message: `Connection is slow (${Math.round(latencyMs)}ms to our server). A live interview may lag.`,
      };
    }

    return { passed: true, message: `Connection looks good (${Math.round(latencyMs)}ms).` };
  } catch {
    return { passed: false, message: "Could not reach the server to check your connection." };
  }
}

export function isFullscreenSupported(): boolean {
  return Boolean(document.fullscreenEnabled) || "webkitFullscreenEnabled" in document;
}

export function isFullscreenActive(): boolean {
  return document.fullscreenElement != null;
}

/** Requests fullscreen on the given element (defaults to <html>). */
export async function requestFullscreen(
  element: HTMLElement = document.documentElement
): Promise<CompatibilityCheckResult> {
  try {
    await element.requestFullscreen();
    return { passed: true, message: "Fullscreen enabled." };
  } catch {
    return {
      passed: false,
      message: "Fullscreen was blocked or dismissed. Please allow fullscreen to continue.",
    };
  }
}

/** Exits fullscreen if active. */
export async function exitFullscreen(): Promise<void> {
  if (document.fullscreenElement) {
    try {
      await document.exitFullscreen();
    } catch {
      // Ignored
    }
  }
}

