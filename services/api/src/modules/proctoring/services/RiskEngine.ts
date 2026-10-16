import { ProctoringFlag } from "../../../agents/proctoring/IProctoringAgent";
import { ProctoringFlagType, ProctoringSeverity } from "../types/proctoring.types";

/**
 * ================================================================
 * Risk Engine
 * ================================================================
 *
 * A separate metric from `trustScore` (which drives the live
 * auto-flag threshold via a generic severity-tier deduction).
 * `riskScore` is per-event-type weighted, matching the points model
 * from the proctoring spec (e.g. a phone is worth far more risk than
 * a moment of looking away) and is meant to be read by humans in the
 * report - "62/100 risk" is easier to act on than "3 MEDIUM, 1 HIGH".
 *
 * Both climb for the same underlying reason (violations), so they
 * usually move together, but they're not literal inverses of each
 * other - don't assume `riskScore === 100 - trustScore`.
 */

/**
 * Points added per *occurrence* of a violation type. Values are a
 * reasonable starting calibration, not measured constants - the
 * relative ordering (a phone matters far more than one glance away)
 * is the important part; tune the absolute numbers against real
 * sessions once you have some.
 *
 * Anything not listed here (mainly INFO-severity lifecycle events:
 * camera/mic started, init completed, a stranger having left, a
 * device reconnecting) contributes 0 - they're telemetry, not risk.
 */
export const RISK_WEIGHTS: Partial<Record<ProctoringFlagType, number>> = {
  // Face checks
  [ProctoringFlagType.NO_FACE_DETECTED]: 5,
  [ProctoringFlagType.MULTIPLE_FACES_DETECTED]: 60,
  [ProctoringFlagType.STRANGER_ENTERED]: 50,
  [ProctoringFlagType.LOOKING_AWAY]: 3,

  // Face position
  [ProctoringFlagType.FACE_TOO_FAR]: 3,
  [ProctoringFlagType.FACE_TOO_CLOSE]: 3,
  [ProctoringFlagType.FACE_OUT_OF_FRAME]: 10,
  [ProctoringFlagType.FACE_PARTIALLY_VISIBLE]: 5,
  [ProctoringFlagType.FACE_COVERED]: 20,

  // Head pose / eyes
  [ProctoringFlagType.LOOKING_LEFT]: 3,
  [ProctoringFlagType.LOOKING_RIGHT]: 3,
  [ProctoringFlagType.LOOKING_UP]: 3,
  [ProctoringFlagType.LOOKING_DOWN]: 3,
  [ProctoringFlagType.LOOKING_BEHIND]: 15,
  [ProctoringFlagType.EYES_CLOSED_EXTENDED]: 10,

  // Browser
  [ProctoringFlagType.TAB_SWITCHED]: 25,
  [ProctoringFlagType.WINDOW_BLURRED]: 20,
  [ProctoringFlagType.FULLSCREEN_EXITED]: 30,
  [ProctoringFlagType.DEVTOOLS_OPENED]: 20,
  [ProctoringFlagType.RIGHT_CLICK_ATTEMPTED]: 5,
  [ProctoringFlagType.COPY_ATTEMPTED]: 15,
  [ProctoringFlagType.PASTE_ATTEMPTED]: 15,
  [ProctoringFlagType.PRINT_SCREEN_ATTEMPTED]: 10,

  // Objects
  [ProctoringFlagType.PROHIBITED_OBJECT_DETECTED]: 40,

  // Device
  [ProctoringFlagType.CAMERA_DEVICE_LOST]: 35,
  [ProctoringFlagType.MIC_DEVICE_LOST]: 35,
  [ProctoringFlagType.INTERNET_LOST]: 10,
  [ProctoringFlagType.WEBCAM_FREEZE_DETECTED]: 15,
  [ProctoringFlagType.DEVICE_SLEEP_DETECTED]: 5,
  [ProctoringFlagType.SCREEN_SHARE_STOPPED]: 25,

  // Behaviour
  [ProctoringFlagType.IDLE_TIME_EXCEEDED]: 5,
  [ProctoringFlagType.RAPID_CLICKING_DETECTED]: 5,

  // Audio
  [ProctoringFlagType.MULTIPLE_VOICES_DETECTED]: 30,
  [ProctoringFlagType.AUDIO_ANOMALY]: 10,

  // Connection
  [ProctoringFlagType.CONNECTION_UNSTABLE]: 5,

  // Init checklist
  [ProctoringFlagType.PROCTORING_INIT_FAILED]: 10,

  // Identity & Consent
  [ProctoringFlagType.IDENTITY_MISMATCH]: 60,
  [ProctoringFlagType.CONSENT_REVOKED]: 100,
};

export const RISK_SCORE_MAX = 100;

export type RiskLevel = "low" | "medium" | "high" | "critical";

const RISK_LEVEL_THRESHOLDS: Array<{ max: number; level: RiskLevel }> = [
  { max: 24, level: "low" },
  { max: 49, level: "medium" },
  { max: 74, level: "high" },
  { max: RISK_SCORE_MAX, level: "critical" },
];

/** Weight for one flag - 0 for anything not in the table above. */
export function weightOf(type: ProctoringFlagType): number {
  return RISK_WEIGHTS[type] ?? 0;
}

/**
 * Incremental risk contribution of a fresh batch of flags from one
 * signal - used to bump a session's live `riskScore` without
 * re-reading its whole event history on every tick.
 */
export function computeRiskDelta(flags: Pick<ProctoringFlag, "type">[]): number {
  return flags.reduce((total, flag) => total + weightOf(flag.type), 0);
}

/**
 * Full recompute of a session's risk score from its complete event
 * history. This is the source of truth used by the report - the
 * live incremental value can drift slightly under concurrent
 * updates, so the report always recomputes fresh rather than trusting
 * the session's running `riskScore` field.
 */
export function computeRiskScore(
  events: Array<{ type: ProctoringFlagType }>
): number {
  const total = events.reduce((sum, event) => sum + weightOf(event.type), 0);
  return Math.max(0, Math.min(RISK_SCORE_MAX, total));
}

export function getRiskLevel(riskScore: number): RiskLevel {
  const clamped = Math.max(0, Math.min(RISK_SCORE_MAX, riskScore));
  const match = RISK_LEVEL_THRESHOLDS.find((tier) => clamped <= tier.max);
  return match?.level ?? "critical";
}

const RECOMMENDATIONS: Record<RiskLevel, string> = {
  low: "No significant concerns detected. No manual review needed.",
  medium: "Minor concerns detected. A quick spot-check of the timeline is recommended before proceeding.",
  high: "Multiple or serious concerns detected. Recommend a recruiter reviews the timeline and evidence before making a decision.",
  critical: "Severe or repeated integrity concerns detected. Recommend flagging this session for mandatory manual review before proceeding.",
};

export function getRecommendation(riskLevel: RiskLevel): string {
  return RECOMMENDATIONS[riskLevel];
}

/**
 * Only counts events with real severity weight as "violations" -
 * matches what riskScore is built from, so the report's violation
 * count and its risk score tell a consistent story.
 */
export function countViolations(
  events: Array<{ type: ProctoringFlagType; severity: ProctoringSeverity }>
): number {
  return events.filter((event) => weightOf(event.type) > 0).length;
}
