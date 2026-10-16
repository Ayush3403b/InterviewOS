import {
  IProctoringAgent,
  ProctoringAnalysisResult,
  ProctoringFlag,
  ProctoringSignalInput,
} from "./IProctoringAgent";

import {
  ProctoredSubjectType,
  ProctoringFlagType,
  ProctoringSeverity,
} from "../../modules/proctoring/types/proctoring.types";

/**
 * No mouse/keyboard activity before an idle flag, per subject type.
 * An MCQ candidate legitimately sits still while reading a question,
 * so the interview thresholds would flag every long question.
 */
const IDLE_THRESHOLDS_MS: Record<
  ProctoredSubjectType,
  { low: number; medium: number }
> = {
  [ProctoredSubjectType.INTERVIEW]: { low: 20_000, medium: 60_000 },
  [ProctoredSubjectType.MCQ_ATTEMPT]: { low: 120_000, medium: 300_000 },
};

/**
 * Matched by substring against whatever labels the client's object
 * detector (COCO-SSD) returns. COCO-SSD's fixed 80-class vocabulary
 * only covers "cell phone", "laptop", "book", and "tv" from this
 * list - it has no classes for a tablet, calculator, loose paper,
 * earphones, or smartwatch, so those items on the original request
 * can't be reliably detected without training/plugging in a
 * different, custom-labeled model. "tv" is used as the closest
 * available proxy for a second monitor.
 */
const PROHIBITED_OBJECTS = [
  "cell phone",
  "mobile phone",
  "phone",
  "laptop",
  "tablet",
  "book",
  "tv",
  "headphones",
  "earbuds",
  "smart watch",
];

/**
 * Deterministic, dependency-free proctoring agent.
 *
 * This is the "MockEvaluationAgent" equivalent for proctoring: it
 * works out of the box with no external API keys, so continuous
 * tracking is functional today. Swap it for a smarter agent later
 * (MediaPipe-assisted scoring, a hosted vision model, YOLO/COCO
 * object detection, etc.) by implementing IProctoringAgent and
 * wiring the new class in `container/index.ts` - nothing else in
 * the app has to change.
 */
export class RuleBasedProctoringAgent implements IProctoringAgent {
  public readonly provider = "rule-based";

  async analyze(
    input: ProctoringSignalInput
  ): Promise<ProctoringAnalysisResult> {
    const flags: ProctoringFlag[] = [];

    /* ---------------------------------------------------------------- */
    /*                              Face Checks                          */
    /* ---------------------------------------------------------------- */

    if (input.faceVisible === false) {
      flags.push({
        type: ProctoringFlagType.NO_FACE_DETECTED,
        severity: ProctoringSeverity.MEDIUM,
        message: "No face detected in frame.",
        confidence: 0.9,
      });
    }

    if (
      typeof input.faceCount === "number" &&
      input.faceCount > 1
    ) {
      flags.push({
        type: ProctoringFlagType.MULTIPLE_FACES_DETECTED,
        severity: input.faceCount >= 3 ? ProctoringSeverity.CRITICAL : ProctoringSeverity.HIGH,
        message: `${input.faceCount} faces detected in frame.`,
        confidence: 0.9,
        metadata: { faceCount: input.faceCount },
      });
    }

    switch (input.personCountEvent) {
      case "stranger_entered":
        flags.push({
          type: ProctoringFlagType.STRANGER_ENTERED,
          severity: ProctoringSeverity.HIGH,
          message: "An additional person entered the frame.",
          confidence: 0.85,
        });
        break;
      case "stranger_left":
        flags.push({
          type: ProctoringFlagType.STRANGER_LEFT,
          severity: ProctoringSeverity.INFO,
          message: "The additional person is no longer in frame.",
          confidence: 0.85,
        });
        break;
      default:
        break;
    }

    if (input.identityMismatch) {
      flags.push({
        type: ProctoringFlagType.IDENTITY_MISMATCH,
        severity: ProctoringSeverity.HIGH,
        message: "Facial identity mismatch detected against baseline reference.",
        confidence: input.identityConfidence ?? 0.85,
        metadata: { identityConfidence: input.identityConfidence },
      });
    }

    if (input.consentRevoked) {
      flags.push({
        type: ProctoringFlagType.CONSENT_REVOKED,
        severity: ProctoringSeverity.CRITICAL,
        message: "Candidate revoked proctoring consent.",
        confidence: 1.0,
      });
    }

    /* ---------------------------------------------------------------- */
    /*                          Face Position Checks                     */
    /* ---------------------------------------------------------------- */

    switch (input.facePosition) {
      case "too_far":
        flags.push({
          type: ProctoringFlagType.FACE_TOO_FAR,
          severity: ProctoringSeverity.LOW,
          message: "Candidate is too far from the camera.",
          confidence: 0.7,
        });
        break;
      case "too_close":
        flags.push({
          type: ProctoringFlagType.FACE_TOO_CLOSE,
          severity: ProctoringSeverity.LOW,
          message: "Candidate is too close to the camera.",
          confidence: 0.7,
        });
        break;
      case "out_of_frame":
        flags.push({
          type: ProctoringFlagType.FACE_OUT_OF_FRAME,
          severity: ProctoringSeverity.MEDIUM,
          message: "Candidate's face has moved out of frame.",
          confidence: 0.75,
        });
        break;
      case "partially_visible":
        flags.push({
          type: ProctoringFlagType.FACE_PARTIALLY_VISIBLE,
          severity: ProctoringSeverity.LOW,
          message: "Candidate's face is only partially visible in frame.",
          confidence: 0.65,
        });
        break;
      case "covered":
        flags.push({
          type: ProctoringFlagType.FACE_COVERED,
          severity: ProctoringSeverity.HIGH,
          message: "Candidate's face may be covered or obscured.",
          confidence: 0.55,
          metadata: {
            note: "Best-effort inference - the client can't directly detect occlusion.",
          },
        });
        break;
      default:
        break;
    }

    /* ---------------------------------------------------------------- */
    /*                            Head Pose Checks                       */
    /* ---------------------------------------------------------------- */

    switch (input.headPose) {
      case "left":
        flags.push({
          type: ProctoringFlagType.LOOKING_LEFT,
          severity: ProctoringSeverity.LOW,
          message: "Candidate is looking to the left.",
          confidence: 0.65,
        });
        break;
      case "right":
        flags.push({
          type: ProctoringFlagType.LOOKING_RIGHT,
          severity: ProctoringSeverity.LOW,
          message: "Candidate is looking to the right.",
          confidence: 0.65,
        });
        break;
      case "up":
        flags.push({
          type: ProctoringFlagType.LOOKING_UP,
          severity: ProctoringSeverity.LOW,
          message: "Candidate is looking up, away from the screen.",
          confidence: 0.6,
        });
        break;
      case "down":
        flags.push({
          type: ProctoringFlagType.LOOKING_DOWN,
          severity: ProctoringSeverity.LOW,
          message: "Candidate is looking down, away from the screen.",
          confidence: 0.6,
        });
        break;
      case "behind":
        flags.push({
          type: ProctoringFlagType.LOOKING_BEHIND,
          severity: ProctoringSeverity.MEDIUM,
          message: "Candidate has turned away from the camera for an extended period.",
          confidence: 0.6,
        });
        break;
      default:
        break;
    }

    /* ---------------------------------------------------------------- */
    /*                            Eye State Checks                       */
    /* ---------------------------------------------------------------- */

    if (
      typeof input.eyesClosedDurationMs === "number" &&
      input.eyesClosedDurationMs > 4000
    ) {
      flags.push({
        type: ProctoringFlagType.EYES_CLOSED_EXTENDED,
        severity: ProctoringSeverity.MEDIUM,
        message: "Candidate's eyes have been closed for an extended period.",
        confidence: 0.55,
        durationMs: input.eyesClosedDurationMs,
        metadata: {
          eyesClosedDurationMs: input.eyesClosedDurationMs,
          note: "Eye-closure proxy only - cannot confirm the candidate is asleep.",
        },
      });
    }

    /* ---------------------------------------------------------------- */
    /*                          Browser Event Checks                     */
    /* ---------------------------------------------------------------- */

    switch (input.browserEvent) {
      case "fullscreen_exited":
        flags.push({
          type: ProctoringFlagType.FULLSCREEN_EXITED,
          severity: ProctoringSeverity.HIGH,
          message: "Candidate exited fullscreen mode.",
          confidence: 0.95,
        });
        break;
      case "devtools_opened":
        flags.push({
          type: ProctoringFlagType.DEVTOOLS_OPENED,
          severity: ProctoringSeverity.HIGH,
          message: "Candidate may have opened browser developer tools.",
          confidence: 0.5,
          metadata: { note: "Best-effort heuristic, not a confirmed detection." },
        });
        break;
      case "right_click":
        flags.push({
          type: ProctoringFlagType.RIGHT_CLICK_ATTEMPTED,
          severity: ProctoringSeverity.LOW,
          message: "Candidate right-clicked during the session.",
          confidence: 0.9,
        });
        break;
      case "copy_attempt":
        flags.push({
          type: ProctoringFlagType.COPY_ATTEMPTED,
          severity: ProctoringSeverity.MEDIUM,
          message: "Candidate attempted to copy content.",
          confidence: 0.9,
        });
        break;
      case "paste_attempt":
        flags.push({
          type: ProctoringFlagType.PASTE_ATTEMPTED,
          severity: ProctoringSeverity.MEDIUM,
          message: "Candidate attempted to paste content.",
          confidence: 0.9,
        });
        break;
      case "print_screen_attempt":
        flags.push({
          type: ProctoringFlagType.PRINT_SCREEN_ATTEMPTED,
          severity: ProctoringSeverity.LOW,
          message: "Candidate may have attempted to take a screenshot.",
          confidence: 0.4,
          metadata: { note: "Under-detects significantly - many OSes intercept this key." },
        });
        break;
      default:
        break;
    }

    /* ---------------------------------------------------------------- */
    /*                          Device Event Checks                       */
    /* ---------------------------------------------------------------- */

    switch (input.deviceEvent) {
      case "camera_disconnected":
        flags.push({
          type: ProctoringFlagType.CAMERA_DEVICE_LOST,
          severity: ProctoringSeverity.HIGH,
          message: "Camera was disconnected during the session.",
          confidence: 0.95,
        });
        break;
      case "camera_reconnected":
        flags.push({
          type: ProctoringFlagType.CAMERA_DEVICE_RESTORED,
          severity: ProctoringSeverity.INFO,
          message: "Camera reconnected.",
          confidence: 1,
        });
        break;
      case "mic_disconnected":
        flags.push({
          type: ProctoringFlagType.MIC_DEVICE_LOST,
          severity: ProctoringSeverity.HIGH,
          message: "Microphone was disconnected during the session.",
          confidence: 0.95,
        });
        break;
      case "mic_reconnected":
        flags.push({
          type: ProctoringFlagType.MIC_DEVICE_RESTORED,
          severity: ProctoringSeverity.INFO,
          message: "Microphone reconnected.",
          confidence: 1,
        });
        break;
      case "internet_lost":
        flags.push({
          type: ProctoringFlagType.INTERNET_LOST,
          severity: ProctoringSeverity.MEDIUM,
          message: "Candidate's internet connection was lost.",
          confidence: 0.9,
        });
        break;
      case "internet_restored":
        flags.push({
          type: ProctoringFlagType.INTERNET_RESTORED,
          severity: ProctoringSeverity.INFO,
          message: "Internet connection restored.",
          confidence: 1,
        });
        break;
      case "webcam_freeze":
        flags.push({
          type: ProctoringFlagType.WEBCAM_FREEZE_DETECTED,
          severity: ProctoringSeverity.MEDIUM,
          message: "Candidate's camera feed appears frozen.",
          confidence: 0.6,
        });
        break;
      case "device_sleep":
        flags.push({
          type: ProctoringFlagType.DEVICE_SLEEP_DETECTED,
          severity: ProctoringSeverity.LOW,
          message: "Candidate's device may have gone to sleep or been heavily throttled.",
          confidence: 0.4,
          metadata: { note: "Could also indicate heavy CPU load rather than sleep." },
        });
        break;
      default:
        break;
    }

    /* ---------------------------------------------------------------- */
    /*                          Behaviour Checks                          */
    /* ---------------------------------------------------------------- */

    const idleThresholds =
      IDLE_THRESHOLDS_MS[input.subjectType] ??
      IDLE_THRESHOLDS_MS[ProctoredSubjectType.INTERVIEW];

    if (
      typeof input.idleDurationMs === "number" &&
      input.idleDurationMs > idleThresholds.medium
    ) {
      flags.push({
        type: ProctoringFlagType.IDLE_TIME_EXCEEDED,
        severity: ProctoringSeverity.MEDIUM,
        message: `Candidate has shown no mouse or keyboard activity for over ${Math.round(
          idleThresholds.medium / 60_000
        )} minute(s).`,
        confidence: 0.7,
        durationMs: input.idleDurationMs,
        metadata: { idleDurationMs: input.idleDurationMs },
      });
    } else if (
      typeof input.idleDurationMs === "number" &&
      input.idleDurationMs > idleThresholds.low
    ) {
      flags.push({
        type: ProctoringFlagType.IDLE_TIME_EXCEEDED,
        severity: ProctoringSeverity.LOW,
        message: "Candidate has been idle for an extended period.",
        confidence: 0.6,
        durationMs: input.idleDurationMs,
        metadata: { idleDurationMs: input.idleDurationMs },
      });
    }

    if (input.rapidClickingDetected) {
      flags.push({
        type: ProctoringFlagType.RAPID_CLICKING_DETECTED,
        severity: ProctoringSeverity.LOW,
        message: "Unusually rapid clicking detected.",
        confidence: 0.55,
      });
    }

    /* ---------------------------------------------------------------- */
    /*                              Gaze Checks                          */
    /* ---------------------------------------------------------------- */

    if (
      typeof input.gazeAwayDurationMs === "number" &&
      input.gazeAwayDurationMs > 5000
    ) {
      flags.push({
        type: ProctoringFlagType.LOOKING_AWAY,
        severity: ProctoringSeverity.MEDIUM,
        message: "Candidate looked away from the screen for an extended period.",
        confidence: 0.75,
        durationMs: input.gazeAwayDurationMs,
        metadata: { gazeAwayDurationMs: input.gazeAwayDurationMs },
      });
    } else if (
      typeof input.gazeAwayDurationMs === "number" &&
      input.gazeAwayDurationMs > 2000
    ) {
      flags.push({
        type: ProctoringFlagType.LOOKING_AWAY,
        severity: ProctoringSeverity.LOW,
        message: "Candidate briefly looked away from the screen.",
        confidence: 0.6,
        durationMs: input.gazeAwayDurationMs,
        metadata: { gazeAwayDurationMs: input.gazeAwayDurationMs },
      });
    }

    /* ---------------------------------------------------------------- */
    /*                          Focus / Tab Checks                       */
    /* ---------------------------------------------------------------- */

    if (input.tabFocused === false) {
      flags.push({
        type: ProctoringFlagType.TAB_SWITCHED,
        severity: ProctoringSeverity.MEDIUM,
        message: "Candidate switched away from the session tab/window.",
        confidence: 0.95,
      });
    }

    if (
      input.screenShareRequired &&
      input.screenShareActive === false
    ) {
      flags.push({
        type: ProctoringFlagType.SCREEN_SHARE_STOPPED,
        severity: ProctoringSeverity.HIGH,
        message: "Required screen share is not active.",
        confidence: 0.95,
      });
    }

    /* ---------------------------------------------------------------- */
    /*                            Object Checks                          */
    /* ---------------------------------------------------------------- */

    const prohibited = (input.objectsDetected ?? []).filter((label) =>
      PROHIBITED_OBJECTS.some((banned) =>
        label.toLowerCase().includes(banned)
      )
    );

    if (prohibited.length > 0) {
      flags.push({
        type: ProctoringFlagType.PROHIBITED_OBJECT_DETECTED,
        severity: ProctoringSeverity.HIGH,
        message: `Prohibited item(s) detected: ${prohibited.join(", ")}.`,
        confidence: 0.8,
        metadata: { objects: prohibited },
      });
    }

    /* ---------------------------------------------------------------- */
    /*                             Audio Checks                           */
    /* ---------------------------------------------------------------- */

    if (input.multipleVoicesDetected) {
      flags.push({
        type: ProctoringFlagType.MULTIPLE_VOICES_DETECTED,
        severity: ProctoringSeverity.HIGH,
        message: "Multiple voices detected during the session.",
        confidence: 0.7,
      });
    }

    if (input.audioAnomaly) {
      flags.push({
        type: ProctoringFlagType.AUDIO_ANOMALY,
        severity: ProctoringSeverity.LOW,
        message: "Unusually loud audio detected.",
        confidence: 0.6,
      });
    }

    /* ---------------------------------------------------------------- */
    /*                          Connection Checks                        */
    /* ---------------------------------------------------------------- */

    if (input.connectionUnstable) {
      flags.push({
        type: ProctoringFlagType.CONNECTION_UNSTABLE,
        severity: ProctoringSeverity.LOW,
        message: "Unstable connection detected during the session.",
        confidence: 0.5,
      });
    }

    /* ---------------------------------------------------------------- */
    /*                    Lifecycle / Telemetry Events                   */
    /* ---------------------------------------------------------------- */
    /*
     * These aren't violations - they're informational markers for the
     * session timeline (camera turned on, location captured, a voice
     * snippet came through). INFO severity carries zero trust-score
     * weight, see computeTrustDelta below.
     */

    if (input.initStatus === "completed") {
      flags.push({
        type: ProctoringFlagType.PROCTORING_INIT_COMPLETED,
        severity: ProctoringSeverity.INFO,
        message: "Pre-session proctoring checklist completed.",
        confidence: 1,
      });
    } else if (input.initStatus === "failed") {
      flags.push({
        type: ProctoringFlagType.PROCTORING_INIT_FAILED,
        severity: ProctoringSeverity.MEDIUM,
        message: input.initFailureReason
          ? `Pre-session proctoring checklist failed: ${input.initFailureReason}.`
          : "Pre-session proctoring checklist failed.",
        confidence: 1,
        metadata: input.initFailureReason
          ? { reason: input.initFailureReason }
          : undefined,
      });
    }

    if (input.cameraState) {
      flags.push({
        type:
          input.cameraState === "started"
            ? ProctoringFlagType.CAMERA_STARTED
            : ProctoringFlagType.CAMERA_STOPPED,
        severity: ProctoringSeverity.INFO,
        message: `Camera ${input.cameraState}.`,
        confidence: 1,
      });
    }

    if (input.micState) {
      flags.push({
        type:
          input.micState === "started"
            ? ProctoringFlagType.MIC_STARTED
            : ProctoringFlagType.MIC_STOPPED,
        severity: ProctoringSeverity.INFO,
        message: `Microphone ${input.micState}.`,
        confidence: 1,
      });
    }

    if (input.location) {
      flags.push({
        type: ProctoringFlagType.LOCATION_CAPTURED,
        severity: ProctoringSeverity.INFO,
        message: "Candidate location captured.",
        confidence: 1,
        metadata: { ...input.location },
      });
    }

    if (input.voiceTranscriptSnippet) {
      flags.push({
        type: ProctoringFlagType.VOICE_TRANSCRIPT_CAPTURED,
        severity: ProctoringSeverity.INFO,
        message: input.voiceTranscriptSnippet,
        confidence: 1,
      });
    }

    /* ---------------------------------------------------------------- */
    /*                          Evidence Attachment                       */
    /* ---------------------------------------------------------------- */

    // Only worth the storage cost on flags a recruiter would actually
    // want to see a picture for - not every LOW/INFO tick.
    if (input.frameBase64) {
      for (const flag of flags) {
        if (
          flag.severity === ProctoringSeverity.MEDIUM ||
          flag.severity === ProctoringSeverity.HIGH ||
          flag.severity === ProctoringSeverity.CRITICAL
        ) {
          flag.cameraFrame = input.frameBase64;
        }
      }
    }

    return {
      flags,
      trustScoreDelta: this.computeTrustDelta(flags),
      metadata: {
        provider: this.provider,
      },
    };
  }

  /**
   * Simple severity-weighted deduction. Kept private so alternate
   * agents are free to score trust however they like.
   */
  private computeTrustDelta(flags: ProctoringFlag[]): number {
    const weight: Record<ProctoringSeverity, number> = {
      [ProctoringSeverity.INFO]: 0,
      [ProctoringSeverity.LOW]: -1,
      [ProctoringSeverity.MEDIUM]: -3,
      [ProctoringSeverity.HIGH]: -8,
      [ProctoringSeverity.CRITICAL]: -20,
    };

    return flags.reduce(
      (total, flag) => total + weight[flag.severity],
      0
    );
  }
}
