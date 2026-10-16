import { useEffect, useRef } from "react";
import type { RefObject } from "react";

import { getCocoSsdModel } from "./visionModels";

const SAMPLE_INTERVAL_MS = 1500;
const CONFIDENCE_THRESHOLD = 0.6;

/**
 * COCO-SSD's vocabulary is a fixed 80 classes. These are the ones
 * relevant to proctoring and that the model can actually recognize:
 *  - "cell phone"  -> Phone
 *  - "laptop"      -> Laptop
 *  - "book"        -> Book / Notebook (COCO doesn't distinguish them)
 *  - "tv"          -> used as the closest available proxy for a
 *                     Second Monitor - it's a flat rectangular
 *                     screen, which is all COCO-SSD can tell you
 *
 * Not detectable with this model, and left out rather than faked:
 * Tablet, Calculator, Paper, Earphones/Earbuds, Smartwatch. None of
 * these are COCO classes - reliably catching them would need a
 * different, custom-labeled detection model.
 */
const RELEVANT_CLASSES = new Set(["cell phone", "laptop", "book", "tv"]);

export interface ObjectDetectionSnapshot {
  /** Labels currently visible, from RELEVANT_CLASSES only. */
  objectsDetected: string[];
  /** True once the model has loaded and is actively sampling. */
  ready: boolean;
}

/**
 * Continuously samples a <video> element for prohibited objects
 * (phone, laptop, book, and "tv" as a stand-in for a second monitor)
 * using the on-device COCO-SSD model loaded during the init
 * checklist. Like `useFaceTracking`, nothing here uploads a frame -
 * only the resulting label list is meant to be sent onward.
 *
 * Degrades to `{ ready: false }` rather than throwing if the model
 * fails to load, so the rest of continuous tracking keeps working.
 */
export function useObjectDetection(videoRef: RefObject<HTMLVideoElement | null> | undefined) {
  const snapshotRef = useRef<ObjectDetectionSnapshot>({
    objectsDetected: [],
    ready: false,
  });

  useEffect(() => {
    if (!videoRef) {
      return;
    }

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    getCocoSsdModel()
      .then((model) => {
        if (cancelled) {
          return;
        }

        snapshotRef.current.ready = true;

        intervalId = setInterval(() => {
          const video = videoRef.current;
          if (!video || video.readyState < 2) {
            return;
          }

          model
            .detect(video)
            .then((predictions) => {
              snapshotRef.current.objectsDetected = predictions
                .filter(
                  (prediction) =>
                    prediction.score >= CONFIDENCE_THRESHOLD &&
                    RELEVANT_CLASSES.has(prediction.class)
                )
                .map((prediction) => prediction.class);
            })
            .catch((error) => {
              console.warn("[proctoring] object detection tick failed:", error);
            });
        }, SAMPLE_INTERVAL_MS);
      })
      .catch((error) => {
        console.warn(
          "[proctoring] object detection unavailable, continuing without it:",
          error
        );
      });

    return () => {
      cancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
    // Runs once - see the identical note in useFaceTracking.ts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { snapshotRef };
}
