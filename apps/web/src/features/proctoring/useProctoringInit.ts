import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

import {
  checkBrowserCompatibility,
  checkDeviceCompatibility,
  checkInternetQuality,
  isFullscreenActive,
  isFullscreenSupported,
  requestFullscreen,
} from "./deviceChecks";
import { getCocoSsdModel, getFaceLandmarker, getTfReady } from "./visionModels";

import type { ProctoringInitStep, ProctoringInitStepId } from "./types";

const STEP_DEFINITIONS: Array<{
  id: ProctoringInitStepId;
  label: string;
  required: boolean;
}> = [
  { id: "recordingConsent", label: "Proctoring & recording consent", required: true },
  { id: "browserCompatibility", label: "Browser compatibility", required: true },
  { id: "deviceCompatibility", label: "Camera & microphone detected", required: true },
  { id: "cameraPermission", label: "Camera permission", required: true },
  { id: "microphonePermission", label: "Microphone permission", required: true },
  { id: "internetQuality", label: "Internet quality", required: false },
  { id: "tensorflowInit", label: "AI engine initialization", required: true },
  { id: "cocoSsdLoading", label: "Object-detection model", required: true },
  { id: "faceModelLoading", label: "Face-tracking model", required: true },
  { id: "fullscreen", label: "Fullscreen mode", required: true },
];

function initialSteps(): ProctoringInitStep[] {
  return STEP_DEFINITIONS.map((def) => ({
    ...def,
    status: "pending",
    message: def.id === "recordingConsent" ? "Consent required to proceed." : "Waiting to start.",
  }));
}

export interface UseProctoringInitResult {
  steps: ProctoringInitStep[];
  /** True once every *required* step has passed. */
  ready: boolean;
  /** True while the automated part of the checklist is running. */
  running: boolean;
  /** Whether the candidate has agreed to proctoring/recording. */
  consentGiven: boolean;
  /** Callback to set or toggle candidate consent. */
  setConsentGiven: (agreed: boolean) => void;
  /** Reference face frame base64 captured during checklist. */
  referenceFrame: string | null;
  /** The camera/mic stream acquired during the permission steps - reuse this
   *  for both the preview <video> and the live interview's face tracking,
   *  rather than calling getUserMedia a second time. */
  videoRef: RefObject<HTMLVideoElement | null>;
  /** Runs every step except fullscreen (which needs a user gesture). */
  start: () => Promise<void>;
  /** Re-runs a single step, e.g. after the candidate fixes a permission. */
  retryStep: (id: ProctoringInitStepId) => Promise<void>;
  /** Must be called from a click handler - browsers require a user gesture. */
  enterFullscreen: () => Promise<void>;
  /** A human-readable reason for the first failed required step, if any. */
  failureReason: string | null;
}

/**
 * Drives the pre-interview readiness checklist: verifies the
 * browser/device can support proctoring at all, requests camera +
 * microphone access, loads the on-device AI models (TensorFlow.js
 * runtime, COCO-SSD object detector, MediaPipe face model), checks
 * connection quality, and puts the page into fullscreen.
 *
 * Doesn't touch the backend directly - call `sendSignal({ initStatus, ... })`
 * from `useProctoring` once `ready` (or a required-step failure) is known,
 * so it lands in the same session's event timeline.
 */
export function useProctoringInit(): UseProctoringInitResult {
  const [steps, setSteps] = useState<ProctoringInitStep[]>(initialSteps());
  const [running, setRunning] = useState(false);
  const [consentGiven, setConsentGivenState] = useState(false);
  const [referenceFrame, setReferenceFrame] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const updateStep = useCallback(
    (id: ProctoringInitStepId, patch: Partial<ProctoringInitStep>) => {
      setSteps((prev) =>
        prev.map((step) => (step.id === id ? { ...step, ...patch } : step))
      );
    },
    []
  );

  const setConsentGiven = useCallback(
    (agreed: boolean) => {
      setConsentGivenState(agreed);
      updateStep("recordingConsent", {
        status: agreed ? "passed" : "pending",
        message: agreed ? "Candidate consent recorded." : "Consent required to proceed.",
      });
    },
    [updateStep]
  );

  const runStep = useCallback(
    async (id: ProctoringInitStepId, fn: () => Promise<{ passed: boolean; message: string }>) => {
      updateStep(id, { status: "checking", message: "Checking..." });
      try {
        const result = await fn();
        updateStep(id, {
          status: result.passed ? "passed" : "failed",
          message: result.message,
        });
        return result.passed;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : typeof error === "string"
            ? error
            : JSON.stringify(error) || "Check failed unexpectedly.";
        updateStep(id, {
          status: "failed",
          message: errorMessage,
        });
        return false;
      }
    },
    [updateStep]
  );

  const runBrowserCompatibility = useCallback(
    () => runStep("browserCompatibility", async () => checkBrowserCompatibility()),
    [runStep]
  );

  const runDeviceCompatibility = useCallback(
    () => runStep("deviceCompatibility", checkDeviceCompatibility),
    [runStep]
  );

  const runCameraAndMic = useCallback(async () => {
    updateStep("cameraPermission", { status: "checking", message: "Requesting access..." });
    updateStep("microphonePermission", { status: "checking", message: "Requesting access..." });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const hasVideo = stream.getVideoTracks().length > 0;
      const hasAudio = stream.getAudioTracks().length > 0;

      updateStep("cameraPermission", {
        status: hasVideo ? "passed" : "failed",
        message: hasVideo ? "Camera access granted." : "No camera track was granted.",
      });
      updateStep("microphonePermission", {
        status: hasAudio ? "passed" : "failed",
        message: hasAudio ? "Microphone access granted." : "No microphone track was granted.",
      });

      return hasVideo && hasAudio;
    } catch (error) {
      const message =
        error instanceof Error && error.name === "NotAllowedError"
          ? "Camera/microphone permission was denied. Please allow access and retry."
          : "Could not access the camera/microphone.";

      updateStep("cameraPermission", { status: "failed", message });
      updateStep("microphonePermission", { status: "failed", message });
      return false;
    }
  }, [updateStep]);

  const runInternetQuality = useCallback(
    () => runStep("internetQuality", checkInternetQuality),
    [runStep]
  );

  const runTensorflowInit = useCallback(
    () =>
      runStep("tensorflowInit", async () => {
        await getTfReady();
        return { passed: true, message: "AI engine ready." };
      }),
    [runStep]
  );

  const runCocoSsdLoading = useCallback(
    () =>
      runStep("cocoSsdLoading", async () => {
        await getCocoSsdModel();
        return { passed: true, message: "Object-detection model loaded." };
      }),
    [runStep]
  );

  const runFaceModelLoading = useCallback(
    () =>
      runStep("faceModelLoading", async () => {
        await getFaceLandmarker();
        return { passed: true, message: "Face-tracking model loaded." };
      }),
    [runStep]
  );

  const enterFullscreen = useCallback(async () => {
    if (!isFullscreenSupported()) {
      updateStep("fullscreen", {
        status: "failed",
        message: "Fullscreen isn't supported in this browser.",
      });
      return;
    }

    updateStep("fullscreen", { status: "checking", message: "Entering fullscreen..." });
    const result = await requestFullscreen();
    updateStep("fullscreen", {
      status: result.passed && isFullscreenActive() ? "passed" : "failed",
      message: result.message,
    });
  }, [updateStep]);

  // Keep fullscreen step in sync if user presses Esc or toggles fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = isFullscreenActive();
      setSteps((prev) =>
        prev.map((step) => {
          if (step.id !== "fullscreen") return step;
          if (step.status === "pending" && !isFull) return step;
          return {
            ...step,
            status: isFull ? "passed" : "failed",
            message: isFull
              ? "Fullscreen active."
              : "Fullscreen was exited. Click 'Go Fullscreen' to continue.",
          };
        })
      );
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  // The interview/test room opens its own camera stream once the gate
  // is passed - release this one when the checklist unmounts, or the
  // camera stays on (and held) behind the room's stream.
  useEffect(() => {
    const streams = streamRef;
    return () => {
      streams.current?.getTracks().forEach((track) => track.stop());
      streams.current = null;
    };
  }, []);

  const retryStep = useCallback(
    async (id: ProctoringInitStepId) => {
      switch (id) {
        case "browserCompatibility":
          await runBrowserCompatibility();
          return;
        case "deviceCompatibility":
          await runDeviceCompatibility();
          return;
        case "cameraPermission":
        case "microphonePermission":
          await runCameraAndMic();
          return;
        case "internetQuality":
          await runInternetQuality();
          return;
        case "tensorflowInit":
          await runTensorflowInit();
          return;
        case "cocoSsdLoading":
          await runCocoSsdLoading();
          return;
        case "faceModelLoading":
          await runFaceModelLoading();
          return;
        case "fullscreen":
          await enterFullscreen();
          return;
        default:
          return;
      }
    },
    [
      runBrowserCompatibility,
      runDeviceCompatibility,
      runCameraAndMic,
      runInternetQuality,
      runTensorflowInit,
      runCocoSsdLoading,
      runFaceModelLoading,
      enterFullscreen,
    ]
  );

  const start = useCallback(async () => {
    setRunning(true);
    try {
      // Fail fast on browser/device support before prompting for
      // permissions the browser may not even be able to honor.
      const browserOk = await runBrowserCompatibility();
      if (!browserOk) return;

      await runDeviceCompatibility();
      await runCameraAndMic();

      // Model loading and connection quality don't depend on each
      // other, so run them together rather than serially.
      await Promise.all([
        runInternetQuality(),
        runTensorflowInit().then((ok) => (ok ? runCocoSsdLoading() : undefined)),
        runFaceModelLoading(),
      ]);

      // Capture initial reference frame baseline if video is active
      if (videoRef.current && videoRef.current.videoWidth > 0) {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = Math.min(640, videoRef.current.videoWidth);
          canvas.height = Math.min(480, videoRef.current.videoHeight);
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            setReferenceFrame(canvas.toDataURL("image/jpeg", 0.7));
          }
        } catch {
          // Non-blocking
        }
      }
      // Fullscreen is intentionally not run here - it requires a
      // user gesture, so the UI must call enterFullscreen() from a
      // click handler.
    } finally {
      setRunning(false);
    }
  }, [
    runBrowserCompatibility,
    runDeviceCompatibility,
    runCameraAndMic,
    runInternetQuality,
    runTensorflowInit,
    runCocoSsdLoading,
    runFaceModelLoading,
  ]);

  const requiredSteps = steps.filter((step) => step.required);
  const ready = requiredSteps.length > 0 && requiredSteps.every((step) => step.status === "passed");
  const firstFailure = requiredSteps.find((step) => step.status === "failed");

  return {
    steps,
    ready,
    running,
    consentGiven,
    setConsentGiven,
    referenceFrame,
    videoRef,
    start,
    retryStep,
    enterFullscreen,
    failureReason: firstFailure ? `${firstFailure.label}: ${firstFailure.message}` : null,
  };
}
