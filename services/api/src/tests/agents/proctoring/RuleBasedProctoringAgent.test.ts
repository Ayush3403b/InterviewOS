import { describe, expect, it } from "vitest";

import { RuleBasedProctoringAgent } from "../../../agents/proctoring/RuleBasedProctoringAgent";
import {
  ProctoredSubjectType,
  ProctoringFlagType,
} from "../../../modules/proctoring/types/proctoring.types";

function baseSignal() {
  return {
    subjectType: ProctoredSubjectType.INTERVIEW,
    subjectId: "sess-1",
    candidateId: "cand-1",
    timestamp: new Date(),
  };
}

describe("RuleBasedProctoringAgent", () => {

  it("raises no flags and no trust penalty for a clean signal", async () => {

    const agent = new RuleBasedProctoringAgent();

    const result = await agent.analyze({
      ...baseSignal(),
      faceVisible: true,
      faceCount: 1,
      tabFocused: true,
    });

    expect(result.flags).toHaveLength(0);
    expect(result.trustScoreDelta).toBe(0);

  });

  describe("face position", () => {

    it.each([
      ["too_far", ProctoringFlagType.FACE_TOO_FAR],
      ["too_close", ProctoringFlagType.FACE_TOO_CLOSE],
      ["out_of_frame", ProctoringFlagType.FACE_OUT_OF_FRAME],
      ["partially_visible", ProctoringFlagType.FACE_PARTIALLY_VISIBLE],
      ["covered", ProctoringFlagType.FACE_COVERED],
    ] as const)("maps facePosition=%s to %s", async (facePosition, expectedType) => {

      const agent = new RuleBasedProctoringAgent();

      const result = await agent.analyze({
        ...baseSignal(),
        facePosition,
      });

      expect(result.flags.map((flag) => flag.type)).toContain(expectedType);
      expect(result.trustScoreDelta).toBeLessThan(0);

    });

    it("raises no face-position flag when in_frame", async () => {

      const agent = new RuleBasedProctoringAgent();

      const result = await agent.analyze({
        ...baseSignal(),
        facePosition: "in_frame",
      });

      expect(result.flags).toHaveLength(0);

    });

  });

  describe("head pose", () => {

    it.each([
      ["left", ProctoringFlagType.LOOKING_LEFT],
      ["right", ProctoringFlagType.LOOKING_RIGHT],
      ["up", ProctoringFlagType.LOOKING_UP],
      ["down", ProctoringFlagType.LOOKING_DOWN],
      ["behind", ProctoringFlagType.LOOKING_BEHIND],
    ] as const)("maps headPose=%s to %s", async (headPose, expectedType) => {

      const agent = new RuleBasedProctoringAgent();

      const result = await agent.analyze({
        ...baseSignal(),
        headPose,
      });

      expect(result.flags.map((flag) => flag.type)).toContain(expectedType);

    });

    it("raises no head-pose flag when centered", async () => {

      const agent = new RuleBasedProctoringAgent();

      const result = await agent.analyze({
        ...baseSignal(),
        headPose: "center",
      });

      expect(result.flags).toHaveLength(0);

    });

  });

  describe("eye closure", () => {

    it("flags eyes closed beyond the extended threshold", async () => {

      const agent = new RuleBasedProctoringAgent();

      const result = await agent.analyze({
        ...baseSignal(),
        eyesClosedDurationMs: 5000,
      });

      expect(result.flags.map((flag) => flag.type)).toContain(
        ProctoringFlagType.EYES_CLOSED_EXTENDED
      );

    });

    it("does not flag a brief, normal blink", async () => {

      const agent = new RuleBasedProctoringAgent();

      const result = await agent.analyze({
        ...baseSignal(),
        eyesClosedDurationMs: 200,
      });

      expect(result.flags).toHaveLength(0);

    });

  });

  describe("init checklist telemetry", () => {

    it("logs a zero-cost INFO event when the checklist completes", async () => {

      const agent = new RuleBasedProctoringAgent();

      const result = await agent.analyze({
        ...baseSignal(),
        initStatus: "completed",
      });

      expect(result.flags).toEqual([
        expect.objectContaining({
          type: ProctoringFlagType.PROCTORING_INIT_COMPLETED,
          severity: "INFO",
        }),
      ]);
      expect(result.trustScoreDelta).toBe(0);

    });

    it("logs and penalizes a failed checklist with its reason", async () => {

      const agent = new RuleBasedProctoringAgent();

      const result = await agent.analyze({
        ...baseSignal(),
        initStatus: "failed",
        initFailureReason: "camera permission denied",
      });

      const flag = result.flags.find(
        (flag) => flag.type === ProctoringFlagType.PROCTORING_INIT_FAILED
      );

      expect(flag?.message).toContain("camera permission denied");
      expect(result.trustScoreDelta).toBeLessThan(0);

    });

  });

  describe("browser events", () => {

    it.each([
      ["fullscreen_exited", ProctoringFlagType.FULLSCREEN_EXITED],
      ["devtools_opened", ProctoringFlagType.DEVTOOLS_OPENED],
      ["right_click", ProctoringFlagType.RIGHT_CLICK_ATTEMPTED],
      ["copy_attempt", ProctoringFlagType.COPY_ATTEMPTED],
      ["paste_attempt", ProctoringFlagType.PASTE_ATTEMPTED],
      ["print_screen_attempt", ProctoringFlagType.PRINT_SCREEN_ATTEMPTED],
    ] as const)("maps browserEvent=%s to %s", async (browserEvent, expectedType) => {

      const agent = new RuleBasedProctoringAgent();

      const result = await agent.analyze({
        ...baseSignal(),
        browserEvent,
      });

      expect(result.flags.map((flag) => flag.type)).toContain(expectedType);
      expect(result.trustScoreDelta).toBeLessThan(0);

    });

  });

  describe("device events", () => {

    it.each([
      ["camera_disconnected", ProctoringFlagType.CAMERA_DEVICE_LOST],
      ["mic_disconnected", ProctoringFlagType.MIC_DEVICE_LOST],
      ["internet_lost", ProctoringFlagType.INTERNET_LOST],
      ["webcam_freeze", ProctoringFlagType.WEBCAM_FREEZE_DETECTED],
      ["device_sleep", ProctoringFlagType.DEVICE_SLEEP_DETECTED],
    ] as const)("maps deviceEvent=%s to a violation flag", async (deviceEvent, expectedType) => {

      const agent = new RuleBasedProctoringAgent();

      const result = await agent.analyze({
        ...baseSignal(),
        deviceEvent,
      });

      expect(result.flags.map((flag) => flag.type)).toContain(expectedType);
      expect(result.trustScoreDelta).toBeLessThan(0);

    });

    it.each([
      ["camera_reconnected", ProctoringFlagType.CAMERA_DEVICE_RESTORED],
      ["mic_reconnected", ProctoringFlagType.MIC_DEVICE_RESTORED],
      ["internet_restored", ProctoringFlagType.INTERNET_RESTORED],
    ] as const)("maps deviceEvent=%s to a zero-cost INFO flag", async (deviceEvent, expectedType) => {

      const agent = new RuleBasedProctoringAgent();

      const result = await agent.analyze({
        ...baseSignal(),
        deviceEvent,
      });

      expect(result.flags).toEqual([
        expect.objectContaining({ type: expectedType, severity: "INFO" }),
      ]);
      expect(result.trustScoreDelta).toBe(0);

    });

  });

  describe("behaviour monitoring", () => {

    it("flags idle time past the long threshold with MEDIUM severity", async () => {

      const agent = new RuleBasedProctoringAgent();

      const result = await agent.analyze({
        ...baseSignal(),
        idleDurationMs: 90_000,
      });

      const flag = result.flags.find(
        (flag) => flag.type === ProctoringFlagType.IDLE_TIME_EXCEEDED
      );

      expect(flag?.severity).toBe("MEDIUM");

    });

    it("flags idle time past the short threshold with LOW severity", async () => {

      const agent = new RuleBasedProctoringAgent();

      const result = await agent.analyze({
        ...baseSignal(),
        idleDurationMs: 25_000,
      });

      const flag = result.flags.find(
        (flag) => flag.type === ProctoringFlagType.IDLE_TIME_EXCEEDED
      );

      expect(flag?.severity).toBe("LOW");

    });

    it("does not flag brief idle gaps", async () => {

      const agent = new RuleBasedProctoringAgent();

      const result = await agent.analyze({
        ...baseSignal(),
        idleDurationMs: 5_000,
      });

      expect(result.flags).toHaveLength(0);

    });

    it("gives MCQ attempts a longer idle allowance, since reading a question is idle time", async () => {

      const agent = new RuleBasedProctoringAgent();

      const reading = await agent.analyze({
        ...baseSignal(),
        subjectType: ProctoredSubjectType.MCQ_ATTEMPT,
        idleDurationMs: 90_000,
      });

      expect(reading.flags).toHaveLength(0);

      const gone = await agent.analyze({
        ...baseSignal(),
        subjectType: ProctoredSubjectType.MCQ_ATTEMPT,
        idleDurationMs: 400_000,
      });

      expect(
        gone.flags.find((flag) => flag.type === ProctoringFlagType.IDLE_TIME_EXCEEDED)
          ?.severity
      ).toBe("MEDIUM");

    });

    it("flags rapid clicking when detected", async () => {

      const agent = new RuleBasedProctoringAgent();

      const result = await agent.analyze({
        ...baseSignal(),
        rapidClickingDetected: true,
      });

      expect(result.flags.map((flag) => flag.type)).toContain(
        ProctoringFlagType.RAPID_CLICKING_DETECTED
      );

    });

  });

  describe("multiple faces", () => {

    it("flags 2 faces as HIGH severity", async () => {

      const agent = new RuleBasedProctoringAgent();

      const result = await agent.analyze({ ...baseSignal(), faceCount: 2 });

      const flag = result.flags.find(
        (flag) => flag.type === ProctoringFlagType.MULTIPLE_FACES_DETECTED
      );

      expect(flag?.severity).toBe("HIGH");

    });

    it("flags 3+ faces as CRITICAL severity", async () => {

      const agent = new RuleBasedProctoringAgent();

      const result = await agent.analyze({ ...baseSignal(), faceCount: 3 });

      const flag = result.flags.find(
        (flag) => flag.type === ProctoringFlagType.MULTIPLE_FACES_DETECTED
      );

      expect(flag?.severity).toBe("CRITICAL");

    });

    it("raises no flag for exactly 1 face", async () => {

      const agent = new RuleBasedProctoringAgent();

      const result = await agent.analyze({ ...baseSignal(), faceCount: 1 });

      expect(result.flags).toHaveLength(0);

    });

    it("flags a stranger entering as HIGH severity", async () => {

      const agent = new RuleBasedProctoringAgent();

      const result = await agent.analyze({
        ...baseSignal(),
        personCountEvent: "stranger_entered",
      });

      const flag = result.flags.find(
        (flag) => flag.type === ProctoringFlagType.STRANGER_ENTERED
      );

      expect(flag?.severity).toBe("HIGH");

    });

    it("logs a stranger leaving as a zero-cost INFO event", async () => {

      const agent = new RuleBasedProctoringAgent();

      const result = await agent.analyze({
        ...baseSignal(),
        personCountEvent: "stranger_left",
      });

      expect(result.flags).toEqual([
        expect.objectContaining({
          type: ProctoringFlagType.STRANGER_LEFT,
          severity: "INFO",
        }),
      ]);
      expect(result.trustScoreDelta).toBe(0);

    });

  });

  describe("object detection", () => {

    it.each([
      ["cell phone"],
      ["laptop"],
      ["book"],
      ["tv"],
    ])("flags a detected %s as a prohibited object", async (label) => {

      const agent = new RuleBasedProctoringAgent();

      const result = await agent.analyze({
        ...baseSignal(),
        objectsDetected: [label],
      });

      const flag = result.flags.find(
        (flag) => flag.type === ProctoringFlagType.PROHIBITED_OBJECT_DETECTED
      );

      expect(flag).toBeDefined();
      expect(flag?.metadata).toEqual({ objects: [label] });

    });

    it("does not flag benign detected objects", async () => {

      const agent = new RuleBasedProctoringAgent();

      const result = await agent.analyze({
        ...baseSignal(),
        objectsDetected: ["chair", "cup", "keyboard"],
      });

      expect(
        result.flags.some(
          (flag) => flag.type === ProctoringFlagType.PROHIBITED_OBJECT_DETECTED
        )
      ).toBe(false);

    });

    it("lists every prohibited object detected at once", async () => {

      const agent = new RuleBasedProctoringAgent();

      const result = await agent.analyze({
        ...baseSignal(),
        objectsDetected: ["cell phone", "book", "chair"],
      });

      const flag = result.flags.find(
        (flag) => flag.type === ProctoringFlagType.PROHIBITED_OBJECT_DETECTED
      );

      expect(flag?.metadata).toEqual({ objects: ["cell phone", "book"] });

    });

  });

  describe("audio", () => {

    it("flags multiple voices as HIGH severity", async () => {

      const agent = new RuleBasedProctoringAgent();

      const result = await agent.analyze({
        ...baseSignal(),
        multipleVoicesDetected: true,
      });

      const flag = result.flags.find(
        (flag) => flag.type === ProctoringFlagType.MULTIPLE_VOICES_DETECTED
      );

      expect(flag?.severity).toBe("HIGH");

    });

    it("flags a loud-audio anomaly as LOW severity", async () => {

      const agent = new RuleBasedProctoringAgent();

      const result = await agent.analyze({
        ...baseSignal(),
        audioAnomaly: true,
      });

      const flag = result.flags.find(
        (flag) => flag.type === ProctoringFlagType.AUDIO_ANOMALY
      );

      expect(flag?.severity).toBe("LOW");

    });

    it("raises no audio flags when neither condition is present", async () => {

      const agent = new RuleBasedProctoringAgent();

      const result = await agent.analyze({
        ...baseSignal(),
        multipleVoicesDetected: false,
        audioAnomaly: false,
      });

      expect(result.flags).toHaveLength(0);

    });

  });

  it("combines multiple simultaneous signals into multiple flags", async () => {

    const agent = new RuleBasedProctoringAgent();

    const result = await agent.analyze({
      ...baseSignal(),
      facePosition: "out_of_frame",
      headPose: "behind",
      tabFocused: false,
    });

    const types = result.flags.map((flag) => flag.type);

    expect(types).toContain(ProctoringFlagType.FACE_OUT_OF_FRAME);
    expect(types).toContain(ProctoringFlagType.LOOKING_BEHIND);
    expect(types).toContain(ProctoringFlagType.TAB_SWITCHED);

  });

});
