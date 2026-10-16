import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

import { connectProctoringSocket } from "./socket";
import { useTabFocus } from "./useTabFocus";
import { useFaceTracking } from "./useFaceTracking";
import { useObjectDetection } from "./useObjectDetection";
import { useBrowserMonitoring } from "./useBrowserMonitoring";
import { useDeviceMonitoring } from "./useDeviceMonitoring";
import { useBehaviorMonitoring } from "./useBehaviorMonitoring";
import { useAudioMonitoring } from "./useAudioMonitoring";

import type {
  ProctoringAlertPayload,
  ProctoringFlag,
  ProctoringSessionStatus,
  ProctoringSignal,
  ProctoringWarningPayload,
  UseProctoringOptions,
} from "./types";

export interface UseProctoringResult {
  status: ProctoringSessionStatus;
  trustScore: number;
  latestWarning: ProctoringFlag[] | null;
  connected: boolean;

  /**
   * Send a one-off signal immediately, outside the regular polling
   * interval. Meant for discrete/edge-triggered events - camera or
   * mic starting/stopping, a location fetch resolving, a speech
   * transcript snippet coming in - rather than continuous state.
   * See features/media-capture for the hooks that call this.
   */
  sendSignal: (signal: Partial<ProctoringSignal>) => void;
}

/**
 * Drives continuous tracking for one interview session:
 *  - runs on-device face/gaze detection (if available)
 *  - watches tab focus / screen-share
 *  - streams derived signals to the backend every `intervalMs`
 *  - surfaces trust score + any warnings back to the UI
 *  - accepts one-off signals (camera/mic/location/voice) via `sendSignal`
 *
 * Mount this once on the interview room page, passing the same
 * <video> element used for the candidate's camera preview.
 */
export function useProctoring(
  options: UseProctoringOptions
): UseProctoringResult {
  const {
    interviewSessionId,
    accessToken,
    videoRef,
    stream,
    blockRightClick,
    blockCopyPaste,
    intervalMs = 3000,
    screenShareRequired = false,
    organizationId,
    consentGiven,
    consentVersion,
    referenceFrame,
  } = options;

  const [status, setStatus] = useState<ProctoringSessionStatus>("ACTIVE");
  const [trustScore, setTrustScore] = useState(100);
  const [latestWarning, setLatestWarning] = useState<ProctoringFlag[] | null>(
    null
  );
  const [connected, setConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const { snapshotRef, resetGazeAwayDuration, resetEyesClosedDuration } =
    useFaceTracking(videoRef);
  const tabFocusedRef = useTabFocus();

  const sendSignal = useCallback(
    (signal: Partial<ProctoringSignal>) => {
      const socket = socketRef.current;
      if (!socket?.connected) {
        return;
      }
      socket.emit("proctoring:signal", { interviewSessionId, ...signal });
    },
    [interviewSessionId]
  );

  const { snapshotRef: behaviorSnapshotRef } = useBehaviorMonitoring();
  const { snapshotRef: audioSnapshotRef } = useAudioMonitoring(stream ?? null);
  const { snapshotRef: objectSnapshotRef } = useObjectDetection(videoRef);
  const prevFaceCountRef = useRef(1);

  useBrowserMonitoring(
    (browserEvent) => sendSignal({ browserEvent }),
    { blockRightClick, blockCopyPaste }
  );

  useDeviceMonitoring(stream ?? null, videoRef, (deviceEvent) =>
    sendSignal({ deviceEvent })
  );

  useEffect(() => {
    const socket = connectProctoringSocket(accessToken);
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("proctoring:join", {
        interviewSessionId,
        organizationId,
        consentGiven,
        consentVersion,
        referenceFrame: referenceFrame || undefined,
      });
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on(
      "proctoring:warning",
      (payload: ProctoringWarningPayload) => {
        setLatestWarning(payload.flags);
        setTrustScore(payload.trustScore);
      }
    );

    socket.on("proctoring:alert", (payload: ProctoringAlertPayload) => {
      setTrustScore(payload.trustScore);
      setStatus(payload.status);
    });

    socket.on("proctoring:error", (payload: { message: string }) => {
      console.warn("[proctoring] socket error:", payload.message);
    });

    const intervalId = setInterval(() => {
      if (!socket.connected) {
        return;
      }

      const face = snapshotRef.current;
      const behavior = behaviorSnapshotRef.current;
      const audio = audioSnapshotRef.current;
      const objects = objectSnapshotRef.current;

      let personCountEvent: "stranger_entered" | "stranger_left" | undefined;
      if (face.ready) {
        const wasAlone = prevFaceCountRef.current <= 1;
        const isAlone = face.faceCount <= 1;
        if (wasAlone && !isAlone) {
          personCountEvent = "stranger_entered";
        } else if (!wasAlone && isAlone) {
          personCountEvent = "stranger_left";
        }
        prevFaceCountRef.current = face.faceCount;
      }

      socket.emit("proctoring:signal", {
        interviewSessionId,
        faceCount: face.ready ? face.faceCount : undefined,
        faceVisible: face.ready ? face.faceVisible : undefined,
        gazeAwayDurationMs: face.ready ? face.gazeAwayDurationMs : undefined,
        facePosition: face.ready ? face.facePosition : undefined,
        headPose: face.ready ? face.headPose : undefined,
        eyesClosedDurationMs: face.ready ? face.eyesClosedDurationMs : undefined,
        personCountEvent,
        objectsDetected: objects.ready ? objects.objectsDetected : undefined,
        multipleVoicesDetected: audio.ready ? audio.multipleVoicesLikely : undefined,
        audioAnomaly: audio.ready ? audio.loudNoiseDetected : undefined,
        idleDurationMs: behavior.idleDurationMs,
        rapidClickingDetected: behavior.rapidClickingDetected,
        tabFocused: tabFocusedRef.current,
        screenShareRequired,
        connectionUnstable: !socket.connected,
      });

      if (face.ready) {
        resetGazeAwayDuration();
        resetEyesClosedDuration();
      }
    }, intervalMs);

    return () => {
      clearInterval(intervalId);
      socket.emit("proctoring:leave", { interviewSessionId });
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewSessionId, accessToken]);

  return { status, trustScore, latestWarning, connected, sendSignal };
}
