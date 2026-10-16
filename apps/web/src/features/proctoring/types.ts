import type { RefObject } from "react";

/**
 * Mirrors `ProctoringSignalInput` on the backend
 * (services/api/src/agents/proctoring/IProctoringAgent.ts).
 *
 * Kept as plain union-string types (no enums) since this project's
 * tsconfig runs with `erasableSyntaxOnly`.
 */
export type ProctoringSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

/** Mirrors ProctoredSubjectType - what a proctoring session is watching. */
export type ProctoredSubjectType = "INTERVIEW" | "MCQ_ATTEMPT";

export type ProctoringSessionStatus =
  | "ACTIVE"
  | "FLAGGED"
  | "COMPLETED"
  | "TERMINATED";

export interface ProctoringFlag {
  type: string;
  severity: ProctoringSeverity;
  message: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}

export type FacePosition =
  | "in_frame"
  | "too_far"
  | "too_close"
  | "out_of_frame"
  | "partially_visible"
  | "covered";

export type HeadPoseDirection = "center" | "left" | "right" | "up" | "down" | "behind";

export type BrowserEvent =
  | "fullscreen_exited"
  | "devtools_opened"
  | "right_click"
  | "copy_attempt"
  | "paste_attempt"
  | "print_screen_attempt";

export type DeviceEvent =
  | "camera_disconnected"
  | "camera_reconnected"
  | "mic_disconnected"
  | "mic_reconnected"
  | "internet_lost"
  | "internet_restored"
  | "webcam_freeze"
  | "device_sleep";

export interface ProctoringSignal {
  faceCount?: number;
  faceVisible?: boolean;
  gazeAwayDurationMs?: number;

  /** Sent every continuous tick, same cadence as faceVisible/faceCount. */
  facePosition?: FacePosition;

  /** Sent every continuous tick, same cadence as faceVisible/faceCount. */
  headPose?: HeadPoseDirection;

  eyesClosedDurationMs?: number;

  /** One-shot report of the pre-interview readiness checklist. */
  initStatus?: "completed" | "failed";
  initFailureReason?: string;

  /** Sent once at the moment a discrete browser event happens. */
  browserEvent?: BrowserEvent;

  /** Sent once at the moment a discrete device/connection event happens. */
  deviceEvent?: DeviceEvent;

  /** Cumulative ms since the last mouse/keyboard activity. */
  idleDurationMs?: number;

  /** Whether an unusually high click rate was just detected. */
  rapidClickingDetected?: boolean;

  /**
   * A one-shot transition event: someone besides the candidate just
   * entered or left the frame. Sent only on the tick where the
   * transition happens - see useProctoring.ts.
   */
  personCountEvent?: "stranger_entered" | "stranger_left";

  /**
   * Object labels currently detected in frame by the on-device
   * COCO-SSD model (e.g. "cell phone", "laptop", "book", "tv"). Sent
   * every continuous tick, same cadence as faceVisible/faceCount -
   * see useObjectDetection.ts for which labels are actually
   * detectable and which requested items aren't.
   */
  objectsDetected?: string[];

  tabFocused?: boolean;
  screenShareRequired?: boolean;
  screenShareActive?: boolean;
  multipleVoicesDetected?: boolean;
  /** Sustained loud audio (shout, slam, dropped object) - see
   *  useAudioMonitoring.ts. Continuous-talking/TV/whisper detection
   *  are deliberately not implemented - see that file's doc comment. */
  audioAnomaly?: boolean;
  connectionUnstable?: boolean;

  /** Sent once at the moment the transition happens, not every tick. */
  cameraState?: "started" | "stopped";
  micState?: "started" | "stopped";

  /** One-shot device geolocation. */
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };

  /** A speech-to-text snippet from the live transcript. */
  voiceTranscriptSnippet?: string;
}

export interface ProctoringWarningPayload {
  flags: ProctoringFlag[];
  trustScore: number;
}

export interface ProctoringAlertPayload extends ProctoringWarningPayload {
  subjectType: ProctoredSubjectType;
  subjectId: string;
  status: ProctoringSessionStatus;
}

export interface UseProctoringOptions {
  /** What's being proctored, and its id (interview session / MCQ attempt). */
  subjectType: ProctoredSubjectType;
  subjectId: string;

  /** JWT access token used for both REST and socket auth. */
  accessToken: string;

  /** Video element to sample for face-tracking. Optional - tab-focus
   *  and screen-share checks still run without it. */
  videoRef?: RefObject<HTMLVideoElement | null>;

  /** The same camera/mic stream backing `videoRef`, used to detect
   *  involuntary disconnects and webcam freezes. Optional - device
   *  monitoring simply doesn't run without it. */
  stream?: MediaStream | null;

  /** Block the native right-click menu and copy/paste, instead of
   *  just reporting the attempt. Defaults to false (report only). */
  blockRightClick?: boolean;
  blockCopyPaste?: boolean;

  /** How often (ms) to send a signal. Defaults to 3000. */
  intervalMs?: number;

  /** Whether screen share is required for this session. */
  screenShareRequired?: boolean;

  /** Whether the candidate provided consent. */
  consentGiven?: boolean;

  /** Version of the consent disclosure (default "1.0"). */
  consentVersion?: string;

  /** Baseline photo/frame captured during pre-interview checklist. */
  referenceFrame?: string | null;
}

/* -------------------------------------------------------------------------- */
/*                        Pre-interview init checklist                        */
/* -------------------------------------------------------------------------- */

export type ProctoringInitStepId =
  | "recordingConsent"
  | "cameraPermission"
  | "microphonePermission"
  | "tensorflowInit"
  | "cocoSsdLoading"
  | "faceModelLoading"
  | "browserCompatibility"
  | "deviceCompatibility"
  | "internetQuality"
  | "fullscreen";

export type ProctoringInitStepStatus =
  | "pending"
  | "checking"
  | "passed"
  | "failed";

export interface ProctoringInitStep {
  id: ProctoringInitStepId;
  label: string;
  status: ProctoringInitStepStatus;
  message: string;
  /** Whether the overall checklist can pass without this step. */
  required: boolean;
}
