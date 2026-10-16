import {
  FaceLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

/**
 * Default hosted MediaPipe assets (Google's CDN). Fine for getting
 * started; for production, download these once and self-host them
 * (same-origin) so tracking doesn't depend on a third-party CDN and
 * so nothing about the candidate's video ever leaves the browser.
 */
export const LOCAL_WASM_BASE = "/wasm";
export const CDN_WASM_BASE =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm";

export const LOCAL_MODEL_ASSET_PATH = "/models/face_landmarker.task";
export const CDN_MODEL_ASSET_PATH =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

/** MediaPipe declares this type but doesn't export it. */
type WasmFileset = Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>;

let sharedLandmarkerPromise: Promise<FaceLandmarker> | null = null;
let sharedCocoSsdPromise: Promise<cocoSsd.ObjectDetection> | null = null;
let sharedTfReadyPromise: Promise<void> | null = null;

async function createLandmarkerWithFallback(
  fileset: WasmFileset,
  modelAssetPath: string
): Promise<FaceLandmarker> {
  try {
    return await FaceLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath,
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numFaces: 3,
    });
  } catch (gpuError) {
    console.warn(
      "[MediaPipe] GPU delegate failed (WebGL/hardware acceleration unavailable), falling back to CPU delegate:",
      gpuError
    );
    return await FaceLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath,
        delegate: "CPU",
      },
      runningMode: "VIDEO",
      numFaces: 3,
    });
  }
}

/**
 * Loads the FaceLandmarker with multi-tier fallback:
 * 1. Local same-origin /wasm + /models/face_landmarker.task (instant, no CORS/CDN block)
 * 2. Public Google / jsDelivr CDN
 * 3. GPU -> CPU delegate fallback
 */
export async function getFaceLandmarker(
  wasmBase?: string,
  modelAssetPath?: string
): Promise<FaceLandmarker> {
  if (!sharedLandmarkerPromise) {
    sharedLandmarkerPromise = (async () => {
      // 1. Try specified custom or local self-hosted assets first
      try {
        const base = wasmBase || LOCAL_WASM_BASE;
        const model = modelAssetPath || LOCAL_MODEL_ASSET_PATH;
        const fileset = await FilesetResolver.forVisionTasks(base);
        return await createLandmarkerWithFallback(fileset, model);
      } catch (localError) {
        console.warn("[MediaPipe] Local/custom assets failed, trying public CDN fallback:", localError);
      }

      // 2. Fallback to public CDN
      const fileset = await FilesetResolver.forVisionTasks(CDN_WASM_BASE);
      return await createLandmarkerWithFallback(fileset, CDN_MODEL_ASSET_PATH);
    })().catch((error) => {
      sharedLandmarkerPromise = null;
      console.error("[MediaPipe] FaceLandmarker initialization failed completely:", error);
      throw error;
    });
  }

  return sharedLandmarkerPromise;
}

/**
 * Initializes the TensorFlow.js backend (WebGL where available,
 * falling back to whatever `tf.ready()` picks). Cheap to call
 * repeatedly - `tf.ready()` itself is idempotent - but this keeps a
 * single shared promise so init-step timing only reflects the first
 * real load.
 */
export function getTfReady(): Promise<void> {
  if (!sharedTfReadyPromise) {
    sharedTfReadyPromise = tf.ready().catch((error) => {
      sharedTfReadyPromise = null;
      throw error;
    });
  }

  return sharedTfReadyPromise!;
}

/**
 * Loads the COCO-SSD object-detection model, used by the (separate)
 * object-detection slice of Phase 9 to spot phones/books/laptops
 * etc. on the desk. Loaded here, during initialization, so the live
 * interview doesn't stall on a model download later - the returned
 * model instance is reused by whichever hook runs detection.
 */
export function getCocoSsdModel(): Promise<cocoSsd.ObjectDetection> {
  if (!sharedCocoSsdPromise) {
    sharedCocoSsdPromise = getTfReady().then(() =>
      cocoSsd.load({ base: "lite_mobilenet_v2" })
    ).catch((error) => {
      sharedCocoSsdPromise = null;
      throw error;
    });
  }

  return sharedCocoSsdPromise!;
}
