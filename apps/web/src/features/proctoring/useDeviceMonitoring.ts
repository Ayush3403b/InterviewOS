import { useEffect, useRef } from "react";
import type { RefObject } from "react";

import type { DeviceEvent } from "./types";

const FREEZE_CHECK_INTERVAL_MS = 2000;
/** Consecutive unchanged samples before calling it frozen (~6s). */
const FREEZE_SAMPLE_THRESHOLD = 3;
/**
 * A gap this large between two animation frames almost never happens
 * from normal load - it means the tab/device was suspended (sleep,
 * OS-level throttling of a backgrounded tab, etc). Kept as a
 * best-effort proxy, not a certain "the device slept" signal - heavy
 * CPU contention can occasionally produce the same symptom.
 */
const SLEEP_GAP_THRESHOLD_MS = 5000;

/**
 * Watches for involuntary hardware/connection problems during an
 * interview: the camera or mic track ending unexpectedly, the
 * network going offline, the camera feed freezing, or a large
 * animation-frame gap suggesting the device/tab was suspended.
 *
 * Pass in the *same* stream the candidate's video preview uses (from
 * `useCameraCapture` or `useProctoringInit`). If your app
 * intentionally stops that stream (e.g. ending the interview), stop
 * passing it into this hook (or unmount it) first - otherwise the
 * resulting native `ended` event will be reported as an involuntary
 * `camera_disconnected`/`mic_disconnected`.
 */
export function useDeviceMonitoring(
  stream: MediaStream | null,
  videoRef: RefObject<HTMLVideoElement | null> | undefined,
  onEvent: (event: DeviceEvent) => void
) {
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    const handleOnline = () => onEventRef.current("internet_restored");
    const handleOffline = () => onEventRef.current("internet_lost");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!stream) {
      return;
    }

    const videoTrack = stream.getVideoTracks()[0];
    const audioTrack = stream.getAudioTracks()[0];

    const handleVideoEnded = () => onEventRef.current("camera_disconnected");
    const handleAudioEnded = () => onEventRef.current("mic_disconnected");
    const handleVideoUnmute = () => onEventRef.current("camera_reconnected");
    const handleAudioUnmute = () => onEventRef.current("mic_reconnected");

    videoTrack?.addEventListener("ended", handleVideoEnded);
    audioTrack?.addEventListener("ended", handleAudioEnded);
    // `unmute` fires when a track that had gone silent (e.g. a
    // momentary OS-level device hiccup) starts producing data again.
    videoTrack?.addEventListener("unmute", handleVideoUnmute);
    audioTrack?.addEventListener("unmute", handleAudioUnmute);

    return () => {
      videoTrack?.removeEventListener("ended", handleVideoEnded);
      audioTrack?.removeEventListener("ended", handleAudioEnded);
      videoTrack?.removeEventListener("unmute", handleVideoUnmute);
      audioTrack?.removeEventListener("unmute", handleAudioUnmute);
    };
  }, [stream]);

  useEffect(() => {
    if (!videoRef) {
      return;
    }

    let lastTime = -1;
    let unchangedCount = 0;
    let flagged = false;

    const intervalId = setInterval(() => {
      const video = videoRef.current;
      const videoTrack = stream?.getVideoTracks()[0];

      if (!video || !videoTrack || videoTrack.readyState !== "live" || document.hidden) {
        unchangedCount = 0;
        flagged = false;
        return;
      }

      if (video.currentTime === lastTime) {
        unchangedCount += 1;
      } else {
        unchangedCount = 0;
        flagged = false;
      }
      lastTime = video.currentTime;

      if (unchangedCount >= FREEZE_SAMPLE_THRESHOLD && !flagged) {
        flagged = true;
        onEventRef.current("webcam_freeze");
      }
    }, FREEZE_CHECK_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [videoRef, stream]);

  useEffect(() => {
    let lastFrameAt = performance.now();
    let rafId: number;

    const tick = (now: number) => {
      const gap = now - lastFrameAt;
      if (gap > SLEEP_GAP_THRESHOLD_MS) {
        onEventRef.current("device_sleep");
      }
      lastFrameAt = now;
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
  }, []);
}
