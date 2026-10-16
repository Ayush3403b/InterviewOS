import {
  ProctoringFlagType,
  ProctoringSeverity,
} from "../../modules/proctoring/types/proctoring.types";

/**
 * ================================================================
 * Proctoring Signal Input
 * ================================================================
 *
 * This is intentionally provider-agnostic. The browser client is
 * responsible for running lightweight, continuous computer-vision
 * (e.g. MediaPipe Face Mesh / Pose, a small object-detection model,
 * tab-visibility + screen-share APIs) and streaming the *derived*
 * signals here every few seconds over the proctoring socket.
 *
 * Sending derived signals instead of raw video keeps this scalable:
 * no video has to be uploaded/stored/transcoded, bandwidth stays
 * tiny, and the backend never has to run heavy CV itself.
 *
 * `frameBase64` is optional and only meant for low-frequency
 * snapshots (e.g. one every 30-60s) for agents that want to run a
 * real vision model periodically (identity re-verification, richer
 * object detection, etc). It should NOT be sent every tick.
 */
export interface ProctoringSignalInput {
  interviewSessionId: string;

  candidateId: string;

  timestamp: Date;

  /** Number of faces the client-side model currently detects. */
  faceCount?: number;

  /** Whether a face is currently visible in frame at all. */
  faceVisible?: boolean;

  /** How long (ms) the candidate's gaze has been away from center, if any. */
  gazeAwayDurationMs?: number;

  /**
   * Where the candidate's face sits in frame. Distinct from
   * `faceVisible` (which only says whether a face was found at
   * all) - this is a position/framing check.
   */
  facePosition?:
    | "in_frame"
    | "too_far"
    | "too_close"
    | "out_of_frame"
    | "partially_visible"
    | "covered";

  /**
   * Lightweight landmark-ratio head-pose estimate, sent every
   * continuous tick alongside faceVisible/faceCount.
   */
  headPose?: "center" | "left" | "right" | "up" | "down" | "behind";

  /** Cumulative ms both eyes have been detected closed, if any. */
  eyesClosedDurationMs?: number;

  /**
   * One-shot report of the pre-interview readiness checklist
   * (camera/mic permission, model loading, fullscreen, device/
   * browser/connection checks) - sent once when it finishes, not on
   * every tick.
   */
  initStatus?: "completed" | "failed";

  /** Which checklist step failed, when `initStatus` is "failed". */
  initFailureReason?: string;

  /**
   * A discrete browser/UI event, sent once at the moment it happens
   * (not on every tick) - see useBrowserMonitoring.ts.
   */
  browserEvent?:
    | "fullscreen_exited"
    | "devtools_opened"
    | "right_click"
    | "copy_attempt"
    | "paste_attempt"
    | "print_screen_attempt";

  /**
   * A discrete device/connection event, sent once at the moment it
   * happens - see useDeviceMonitoring.ts.
   */
  deviceEvent?:
    | "camera_disconnected"
    | "camera_reconnected"
    | "mic_disconnected"
    | "mic_reconnected"
    | "internet_lost"
    | "internet_restored"
    | "webcam_freeze"
    | "device_sleep";

  /** Cumulative ms since the last detected mouse/keyboard activity. */
  idleDurationMs?: number;

  /** Whether an unusually high click rate was just detected. */
  rapidClickingDetected?: boolean;

  /**
   * A one-shot transition event: someone besides the candidate just
   * entered or left the frame (faceCount crossing 1 <-> 2+). Sent
   * only on the tick where the transition happens.
   */
  personCountEvent?: "stranger_entered" | "stranger_left";

  /** Whether the browser tab/window currently has focus. */
  tabFocused?: boolean;

  /** Whether screen share is required for this interview. */
  screenShareRequired?: boolean;

  /** Whether screen share is currently active (if required). */
  screenShareActive?: boolean;

  /** Client-detected objects of interest, e.g. ["cell phone", "book"]. */
  objectsDetected?: string[];

  /** Whether the client's audio analysis detected more than one speaker. */
  multipleVoicesDetected?: boolean;

  /** Sustained loud audio - see useAudioMonitoring.ts on the client. */
  audioAnomaly?: boolean;

  /** Rolling connection-quality flag from the socket transport. */
  connectionUnstable?: boolean;

  /**
   * Camera/mic lifecycle transitions, sent once at the moment they
   * happen (not on every tick) - see useCameraCapture on the client.
   */
  cameraState?: "started" | "stopped";
  micState?: "started" | "stopped";

  /** One-shot device geolocation, sent once per fetch. */
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };

  /** A speech-to-text snippet from the candidate's live transcript. */
  voiceTranscriptSnippet?: string;

  /** Optional low-frequency snapshot for heavier vision agents. */
  frameBase64?: string;

  /** True if client-side face landmark/descriptor comparison detected an identity mismatch. */
  identityMismatch?: boolean;

  /** Confidence rating (0-1) of the identity verification match/mismatch. */
  identityConfidence?: number;

  /** Sent if the candidate revokes consent during the session. */
  consentRevoked?: boolean;

  /** Free-form extra data specific to a given client-side detector. */
  extra?: Record<string, unknown>;
}

export interface ProctoringFlag {
  type: ProctoringFlagType;

  severity: ProctoringSeverity;

  message: string;

  /** 0-1 confidence reported by the agent. */
  confidence: number;

  /** How long (ms) the underlying condition had been ongoing, for
   *  flags derived from a continuous duration signal. */
  durationMs?: number;

  /** Evidence snapshot - see `frameBase64` above. Only populate this
   *  on flags worth the storage cost (MEDIUM+ severity). */
  cameraFrame?: string;

  metadata?: Record<string, unknown>;
}

export interface ProctoringAnalysisResult {
  flags: ProctoringFlag[];

  /** Net change to apply to the session trust score (usually <= 0). */
  trustScoreDelta: number;

  metadata?: Record<string, unknown>;
}

/**
 * Any proctoring "brain" - rule-based, MediaPipe-assisted, a hosted
 * vision model, or a composite of several - implements this. Nothing
 * outside `agents/proctoring` needs to know which one is in use, the
 * same separation the evaluation module already uses for
 * OpenAI / Claude / Gemini.
 */
export interface IProctoringAgent {
  readonly provider: string;

  analyze(
    input: ProctoringSignalInput
  ): Promise<ProctoringAnalysisResult>;
}
