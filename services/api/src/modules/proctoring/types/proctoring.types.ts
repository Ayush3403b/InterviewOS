import { Document, Types } from "mongoose";

/* -------------------------------------------------------------------------- */
/*                                    Enums                                    */
/* -------------------------------------------------------------------------- */

export enum ProctoringSessionStatus {
  ACTIVE = "ACTIVE",
  FLAGGED = "FLAGGED",
  COMPLETED = "COMPLETED",
  TERMINATED = "TERMINATED",
}

export enum ProctoringSeverity {
  /**
   * Not a violation - a lifecycle/telemetry event worth keeping in
   * the timeline (camera started, location captured, etc). Costs
   * zero trust score.
   */
  INFO = "INFO",
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum ProctoringFlagType {
  NO_FACE_DETECTED = "NO_FACE_DETECTED",
  MULTIPLE_FACES_DETECTED = "MULTIPLE_FACES_DETECTED",
  STRANGER_ENTERED = "STRANGER_ENTERED",
  STRANGER_LEFT = "STRANGER_LEFT",
  LOOKING_AWAY = "LOOKING_AWAY",
  TAB_SWITCHED = "TAB_SWITCHED",
  WINDOW_BLURRED = "WINDOW_BLURRED",
  SCREEN_SHARE_STOPPED = "SCREEN_SHARE_STOPPED",
  PROHIBITED_OBJECT_DETECTED = "PROHIBITED_OBJECT_DETECTED",
  MULTIPLE_VOICES_DETECTED = "MULTIPLE_VOICES_DETECTED",
  AUDIO_ANOMALY = "AUDIO_ANOMALY",
  CONNECTION_UNSTABLE = "CONNECTION_UNSTABLE",
  IDENTITY_MISMATCH = "IDENTITY_MISMATCH",
  CONSENT_REVOKED = "CONSENT_REVOKED",

  /**
   * Face-position checks - where in frame the candidate's face is,
   * as opposed to whether it's visible at all (NO_FACE_DETECTED).
   */
  FACE_TOO_FAR = "FACE_TOO_FAR",
  FACE_TOO_CLOSE = "FACE_TOO_CLOSE",
  FACE_OUT_OF_FRAME = "FACE_OUT_OF_FRAME",
  FACE_PARTIALLY_VISIBLE = "FACE_PARTIALLY_VISIBLE",
  /**
   * Best-effort proxy only: inferred when a previously-tracked,
   * centered face disappears abruptly without the head-turn or
   * frame-edge motion that would explain it. See
   * `useFaceTracking.ts` for the exact heuristic and its limits.
   */
  FACE_COVERED = "FACE_COVERED",

  /** Head pose - lightweight 2D-landmark heuristic, not true 3D pose. */
  LOOKING_LEFT = "LOOKING_LEFT",
  LOOKING_RIGHT = "LOOKING_RIGHT",
  LOOKING_UP = "LOOKING_UP",
  LOOKING_DOWN = "LOOKING_DOWN",
  /** Best-effort: an extreme, sustained head turn away from camera. */
  LOOKING_BEHIND = "LOOKING_BEHIND",

  /**
   * Sustained eye closure. Labeled "extended" rather than "sleeping"
   * - closed eyes for several seconds is the only reliable signal a
   * browser can produce; it can't confirm the candidate is asleep.
   */
  EYES_CLOSED_EXTENDED = "EYES_CLOSED_EXTENDED",

  /** Pre-interview readiness checklist outcome - reported once. */
  PROCTORING_INIT_COMPLETED = "PROCTORING_INIT_COMPLETED",
  PROCTORING_INIT_FAILED = "PROCTORING_INIT_FAILED",

  /**
   * Browser-event monitoring - discrete, one-shot events reported the
   * moment they happen (see useBrowserMonitoring.ts on the client).
   */
  FULLSCREEN_EXITED = "FULLSCREEN_EXITED",
  /**
   * Best-effort only: a keyboard-shortcut/window-size heuristic, not
   * a real "DevTools is open" signal - browsers expose no such API.
   */
  DEVTOOLS_OPENED = "DEVTOOLS_OPENED",
  RIGHT_CLICK_ATTEMPTED = "RIGHT_CLICK_ATTEMPTED",
  COPY_ATTEMPTED = "COPY_ATTEMPTED",
  PASTE_ATTEMPTED = "PASTE_ATTEMPTED",
  /**
   * Best-effort only: many OSes intercept the Print Screen key before
   * it ever reaches the browser, so this under-detects significantly.
   */
  PRINT_SCREEN_ATTEMPTED = "PRINT_SCREEN_ATTEMPTED",

  /** Device monitoring - involuntary hardware/connection changes. */
  CAMERA_DEVICE_LOST = "CAMERA_DEVICE_LOST",
  CAMERA_DEVICE_RESTORED = "CAMERA_DEVICE_RESTORED",
  MIC_DEVICE_LOST = "MIC_DEVICE_LOST",
  MIC_DEVICE_RESTORED = "MIC_DEVICE_RESTORED",
  INTERNET_LOST = "INTERNET_LOST",
  INTERNET_RESTORED = "INTERNET_RESTORED",
  WEBCAM_FREEZE_DETECTED = "WEBCAM_FREEZE_DETECTED",
  /**
   * Best-effort: a large gap between scheduled animation frames.
   * Can also mean the tab was heavily throttled/backgrounded, not
   * necessarily that the device itself slept - see doc comment on
   * `useDeviceMonitoring.ts`.
   */
  DEVICE_SLEEP_DETECTED = "DEVICE_SLEEP_DETECTED",

  /** Behaviour monitoring - mouse/keyboard liveness patterns. */
  IDLE_TIME_EXCEEDED = "IDLE_TIME_EXCEEDED",
  RAPID_CLICKING_DETECTED = "RAPID_CLICKING_DETECTED",

  /** Lifecycle/telemetry events - informational, not violations. */
  CAMERA_STARTED = "CAMERA_STARTED",
  CAMERA_STOPPED = "CAMERA_STOPPED",
  MIC_STARTED = "MIC_STARTED",
  MIC_STOPPED = "MIC_STOPPED",
  LOCATION_CAPTURED = "LOCATION_CAPTURED",
  VOICE_TRANSCRIPT_CAPTURED = "VOICE_TRANSCRIPT_CAPTURED",
}

export enum ProctoringEventStatus {
  /** Default - not yet reviewed by a recruiter/proctor. */
  DETECTED = "DETECTED",
  /** A recruiter has reviewed it and it stands as-is. */
  ACKNOWLEDGED = "ACKNOWLEDGED",
  /** A recruiter reviewed it and judged it a false positive / non-issue. */
  DISMISSED = "DISMISSED",
}

/* -------------------------------------------------------------------------- */
/*                             Proctoring Session                             */
/* -------------------------------------------------------------------------- */

export interface ProctoringSession {
  interviewSessionId: Types.ObjectId;

  candidateId: Types.ObjectId;

  organizationId?: Types.ObjectId;

  status: ProctoringSessionStatus;

  /**
   * 0 - 100. Starts at 100, decays as violations occur.
   */
  trustScore: number;

  /**
   * 0 - 100. Starts at 0, climbs as violations occur - see
   * `services/RiskEngine.ts`. A separate metric from trustScore:
   * trustScore drives the live auto-flag threshold, riskScore is the
   * candidate-facing "how risky does this session look" number used
   * in the report. They move in the same direction but aren't just
   * inverses of each other, since they're weighted differently.
   */
  riskScore: number;

  totalSignals: number;

  /**
   * Count of occurrences keyed by ProctoringFlagType.
   */
  violationCounts: Record<string, number>;

  agentProvider: string;

  /** Timestamp when the candidate provided legally binding consent. */
  consentGivenAt?: Date;

  /** Version of the consent agreement agreed to (e.g. "1.0"). */
  consentVersion?: string;

  /** Initial reference camera snapshot captured upon checklist/consent verification. */
  referenceFrame?: string;

  startedAt: Date;

  lastSignalAt?: Date;

  flaggedAt?: Date;

  endedAt?: Date;

  createdAt: Date;

  updatedAt: Date;
}

export interface ProctoringSessionDocument
  extends ProctoringSession,
    Document<Types.ObjectId> {}

/* -------------------------------------------------------------------------- */
/*                              Proctoring Event                              */
/* -------------------------------------------------------------------------- */

export interface ProctoringEvent {
  proctoringSessionId: Types.ObjectId;

  interviewSessionId: Types.ObjectId;

  candidateId: Types.ObjectId;

  type: ProctoringFlagType;

  severity: ProctoringSeverity;

  message: string;

  confidence: number;

  /** Recruiter review workflow - defaults to DETECTED. */
  status: ProctoringEventStatus;

  /**
   * A base64 data URL of the candidate's camera feed at the moment
   * this event fired, when the client sent one (see `frameBase64`
   * on ProctoringSignalInput). Only attached for MEDIUM+ severity
   * flags to keep storage bounded - not every tick.
   */
  cameraFrame?: string;

  /** How long (ms) the underlying condition had been ongoing, for
   *  flags derived from a continuous signal (e.g. gaze-away, idle,
   *  eyes-closed). Undefined for instantaneous events. */
  durationMs?: number;

  metadata?: Record<string, unknown>;

  occurredAt: Date;

  /** Auto-expiry date for MongoDB TTL indexing (default 30 days retention). */
  expiresAt?: Date;

  createdAt: Date;

  updatedAt: Date;
}

export interface ProctoringEventDocument
  extends ProctoringEvent,
    Document<Types.ObjectId> {}
