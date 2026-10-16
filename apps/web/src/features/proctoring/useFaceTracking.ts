import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { FaceLandmarkerResult } from "@mediapipe/tasks-vision";

import { getFaceLandmarker } from "./visionModels";
import type { FacePosition, HeadPoseDirection } from "./types";

/**
 * Landmark indices from MediaPipe's 478-point face mesh topology.
 * These specific indices (nose tip, forehead/chin midline points,
 * and the two 6-point eye contours used for the eye-aspect-ratio
 * formula below) are the same ones widely used across MediaPipe
 * blink/gaze tutorials - not something this file invented.
 */
const NOSE_TIP = 1;
const FOREHEAD_TOP = 10;
const CHIN_BOTTOM = 152;

/** [outerCorner, upperLid1, upperLid2, innerCorner, lowerLid1, lowerLid2] */
const EYE_A = [33, 160, 158, 133, 153, 144] as const;
const EYE_B = [362, 385, 387, 263, 373, 380] as const;

/**
 * Everything below (face position, head pose, eye closure) is a
 * lightweight 2D-landmark heuristic, not a calibrated 3D model. The
 * thresholds are reasonable starting points, not measured constants
 * - tune them against real footage before relying on them for
 * high-stakes decisions.
 */
const GAZE_AWAY_THRESHOLD = 0.28;
const YAW_THRESHOLD = 0.28;
const YAW_EXTREME_THRESHOLD = 0.5;
const PITCH_DOWN_THRESHOLD = 0.62;
const PITCH_UP_THRESHOLD = 0.38;
const TOO_CLOSE_WIDTH_RATIO = 0.75;
const TOO_FAR_WIDTH_RATIO = 0.15;
const FRAME_EDGE_MARGIN = 0.03;
const EAR_CLOSED_THRESHOLD = 0.18;

const SAMPLE_INTERVAL_MS = 500;

type FaceLandmarks = FaceLandmarkerResult["faceLandmarks"][number];

export interface FaceTrackingSnapshot {
  faceCount: number;
  faceVisible: boolean;
  /** Cumulative ms the gaze has been away since the last reset. */
  gazeAwayDurationMs: number;
  /** Where the face sits in frame - distinct from faceVisible. */
  facePosition: FacePosition;
  /** Lightweight landmark-ratio head-pose estimate. */
  headPose: HeadPoseDirection;
  /** Cumulative ms both eyes have been detected closed. */
  eyesClosedDurationMs: number;
  /** True once the model has loaded and is actively sampling. */
  ready: boolean;
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Eye-aspect-ratio: low when the eye is closed, ~0.25-0.35 when open. */
function eyeAspectRatio(landmarks: FaceLandmarks, indices: readonly number[]): number | null {
  const [outer, up1, up2, inner, low1, low2] = indices.map((i) => landmarks[i]);
  if (!outer || !up1 || !up2 || !inner || !low1 || !low2) {
    return null;
  }
  const horizontal = dist(outer, inner) || 1e-6;
  return (dist(up1, low2) + dist(up2, low1)) / (2 * horizontal);
}

interface FrameAnalysis {
  facePosition: FacePosition;
  headPose: HeadPoseDirection;
  isGazeAway: boolean;
  isEyesClosed: boolean | null;
  /** Signed yaw ratio, kept around to help classify a subsequent tracking loss. */
  yawRatio: number;
}

function analyzeFrame(landmarks: FaceLandmarks): FrameAnalysis | null {
  const nose = landmarks[NOSE_TIP];
  const forehead = landmarks[FOREHEAD_TOP];
  const chin = landmarks[CHIN_BOTTOM];
  const eyeA = landmarks[EYE_A[0]];
  const eyeB = landmarks[EYE_B[3]];

  if (!nose || !forehead || !chin || !eyeA || !eyeB) {
    return null;
  }

  /* ---------------------------- Face position ---------------------------- */

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const point of landmarks) {
    if (point.x < minX) minX = point.x;
    if (point.x > maxX) maxX = point.x;
    if (point.y < minY) minY = point.y;
    if (point.y > maxY) maxY = point.y;
  }

  const faceWidth = maxX - minX;

  let facePosition: FacePosition;
  if (faceWidth > TOO_CLOSE_WIDTH_RATIO) {
    facePosition = "too_close";
  } else if (faceWidth < TOO_FAR_WIDTH_RATIO) {
    facePosition = "too_far";
  } else if (
    minX < FRAME_EDGE_MARGIN ||
    maxX > 1 - FRAME_EDGE_MARGIN ||
    minY < FRAME_EDGE_MARGIN ||
    maxY > 1 - FRAME_EDGE_MARGIN
  ) {
    facePosition = "partially_visible";
  } else {
    facePosition = "in_frame";
  }

  /* ------------------------------ Head pose ------------------------------ */

  const eyeMidpointX = (eyeA.x + eyeB.x) / 2;
  const faceWidthSpan = Math.abs(eyeB.x - eyeA.x) || 1e-6;
  const faceHeightSpan = Math.abs(chin.y - forehead.y) || 1e-6;

  const yawRatio = (nose.x - eyeMidpointX) / faceWidthSpan;
  const pitchRatio = (nose.y - forehead.y) / faceHeightSpan;

  let headPose: HeadPoseDirection = "center";
  if (Math.abs(yawRatio) > YAW_THRESHOLD) {
    headPose = yawRatio > 0 ? "right" : "left";
  } else if (pitchRatio > PITCH_DOWN_THRESHOLD) {
    headPose = "down";
  } else if (pitchRatio < PITCH_UP_THRESHOLD) {
    headPose = "up";
  }

  const isGazeAway = Math.abs(yawRatio) > GAZE_AWAY_THRESHOLD || Math.abs(pitchRatio - 0.5) > GAZE_AWAY_THRESHOLD;

  /* ------------------------------- Eye state ------------------------------ */

  const earA = eyeAspectRatio(landmarks, EYE_A);
  const earB = eyeAspectRatio(landmarks, EYE_B);
  const ears = [earA, earB].filter((v): v is number => v !== null);
  const isEyesClosed = ears.length > 0 ? ears.reduce((a, b) => a + b, 0) / ears.length < EAR_CLOSED_THRESHOLD : null;

  return { facePosition, headPose, isGazeAway, isEyesClosed, yawRatio };
}

/**
 * Continuously samples a <video> element for face count, position,
 * head pose, gaze, and eye closure using an on-device MediaPipe
 * model. Nothing here ever uploads a frame or the video itself -
 * only the derived values in the returned snapshot are meant to be
 * sent onward.
 *
 * If the model fails to load (blocked CDN, unsupported browser,
 * etc.) this degrades to `{ ready: false }` rather than throwing, so
 * the rest of continuous tracking (tab focus, screen share) keeps
 * working.
 */
export function useFaceTracking(
  videoRef: RefObject<HTMLVideoElement | null> | undefined,
  options?: { wasmBase?: string; modelAssetPath?: string }
) {
  const snapshotRef = useRef<FaceTrackingSnapshot>({
    faceCount: 0,
    faceVisible: false,
    gazeAwayDurationMs: 0,
    facePosition: "out_of_frame",
    headPose: "center",
    eyesClosedDurationMs: 0,
    ready: false,
  });

  const wasAwayRef = useRef(false);
  const awaySinceRef = useRef<number | null>(null);
  const eyesClosedSinceRef = useRef<number | null>(null);
  const wasEyesClosedRef = useRef(false);

  /** Last known state while a face was tracked, used to classify a loss. */
  const lastKnownRef = useRef<{ facePosition: FacePosition; yawRatio: number } | null>(null);

  useEffect(() => {
    if (!videoRef) {
      return;
    }

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    getFaceLandmarker(options?.wasmBase, options?.modelAssetPath)
      .then((landmarker) => {
        if (cancelled) {
          return;
        }

        snapshotRef.current.ready = true;

        intervalId = setInterval(() => {
          const video = videoRef.current;

          if (!video || video.readyState < 2) {
            return;
          }

          const result = landmarker.detectForVideo(video, performance.now());
          const faceCount = result.faceLandmarks.length;
          const faceVisible = faceCount > 0;

          snapshotRef.current.faceCount = faceCount;
          snapshotRef.current.faceVisible = faceVisible;

          if (!faceVisible) {
            /*
             * Best-effort classification of *why* the face disappeared:
             *  - it was already clipped by a frame edge -> the
             *    candidate physically moved out of frame.
             *  - the head had turned to an extreme yaw just before
             *    losing tracking -> they turned away from the camera.
             *  - otherwise, a centered, normally-posed face vanished
             *    abruptly -> most likely something now covers it
             *    (hand, mask, object). This can't be confirmed
             *    directly - see FACE_COVERED's doc comment.
             */
            const last = lastKnownRef.current;

            if (last?.facePosition === "partially_visible") {
              snapshotRef.current.facePosition = "out_of_frame";
              snapshotRef.current.headPose = "center";
            } else if (last && Math.abs(last.yawRatio) > YAW_EXTREME_THRESHOLD) {
              snapshotRef.current.facePosition = "out_of_frame";
              snapshotRef.current.headPose = "behind";
            } else if (last) {
              snapshotRef.current.facePosition = "covered";
              snapshotRef.current.headPose = "center";
            } else {
              snapshotRef.current.facePosition = "out_of_frame";
              snapshotRef.current.headPose = "center";
            }

            if (awaySinceRef.current === null) {
              awaySinceRef.current = Date.now();
            }
          } else {
            const analysis = analyzeFrame(result.faceLandmarks[0]);

            if (analysis) {
              snapshotRef.current.facePosition = analysis.facePosition;
              snapshotRef.current.headPose = analysis.headPose;
              lastKnownRef.current = {
                facePosition: analysis.facePosition,
                yawRatio: analysis.yawRatio,
              };

              if (analysis.isGazeAway && awaySinceRef.current === null) {
                awaySinceRef.current = Date.now();
              } else if (!analysis.isGazeAway) {
                awaySinceRef.current = null;
              }
              wasAwayRef.current = analysis.isGazeAway;

              if (analysis.isEyesClosed) {
                if (eyesClosedSinceRef.current === null) {
                  eyesClosedSinceRef.current = Date.now();
                }
                wasEyesClosedRef.current = true;
              } else if (analysis.isEyesClosed === false) {
                eyesClosedSinceRef.current = null;
                wasEyesClosedRef.current = false;
              }
              /* analysis.isEyesClosed === null -> landmarks for EAR were
               * unavailable this tick; leave the running state as-is. */
            }
          }

          snapshotRef.current.gazeAwayDurationMs = awaySinceRef.current
            ? Date.now() - awaySinceRef.current
            : 0;

          snapshotRef.current.eyesClosedDurationMs = eyesClosedSinceRef.current
            ? Date.now() - eyesClosedSinceRef.current
            : 0;
        }, SAMPLE_INTERVAL_MS);
      })
      .catch((error) => {
        // Graceful degradation - continuous tracking continues with
        // tab-focus/screen-share signals only.
        console.warn(
          "[proctoring] face tracking unavailable, continuing without it:",
          error
        );
      });

    return () => {
      cancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
    // Runs once: videoRef is a stable ref object, and the interval
    // above re-checks videoRef.current on every tick rather than
    // relying on this effect to re-fire when the element attaches.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Call after each signal emission so away-duration doesn't double-count. */
  function resetGazeAwayDuration() {
    if (!wasAwayRef.current) {
      awaySinceRef.current = null;
    } else {
      // Still away - restart the clock from now so the *next*
      // interval reports only the incremental away time.
      awaySinceRef.current = Date.now();
    }
    snapshotRef.current.gazeAwayDurationMs = 0;
  }

  /** Call after each signal emission so eyes-closed duration doesn't double-count. */
  function resetEyesClosedDuration() {
    if (!wasEyesClosedRef.current) {
      eyesClosedSinceRef.current = null;
    } else {
      eyesClosedSinceRef.current = Date.now();
    }
    snapshotRef.current.eyesClosedDurationMs = 0;
  }

  return { snapshotRef, resetGazeAwayDuration, resetEyesClosedDuration };
}
