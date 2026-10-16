import { useCallback, useRef, useState } from "react";
import type { RefObject } from "react";

export interface CameraCaptureState {
  active: boolean;
  error: string | null;
  starting: boolean;
}

export interface UseCameraCaptureResult extends CameraCaptureState {
  videoRef: RefObject<HTMLVideoElement | null>;
  /** Exposed so callers can pass it to useProctoring's device monitoring. */
  stream: MediaStream | null;
  start: () => Promise<void>;
  stop: () => void;
}

/**
 * Owns the actual `getUserMedia` call and the resulting <video>
 * element - the piece that was previously left for the consumer to
 * wire up themselves (see the proctoring feature's README). The
 * returned `videoRef` can be passed straight into `useProctoring`
 * so face-tracking runs on the same stream.
 *
 * Doesn't know anything about proctoring/telemetry - callers decide
 * what to do with `start`/`stop` (e.g. call proctoring's `sendSignal`
 * with `{ cameraState: "started" }`).
 */
export function useCameraCapture(): UseCameraCaptureResult {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const start = useCallback(async () => {
    if (streamRef.current) {
      return;
    }

    setStarting(true);
    setError(null);

    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = nextStream;
      setStream(nextStream);

      if (videoRef.current) {
        videoRef.current.srcObject = nextStream;
      }

      setActive(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not access camera/microphone."
      );
    } finally {
      setStarting(false);
    }
  }, []);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setActive(false);
  }, []);

  return { videoRef, stream, active, starting, error, start, stop };
}
