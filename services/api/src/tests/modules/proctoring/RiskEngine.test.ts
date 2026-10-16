import { describe, expect, it } from "vitest";

import {
  computeRiskDelta,
  computeRiskScore,
  countViolations,
  getRecommendation,
  getRiskLevel,
  weightOf,
} from "../../../modules/proctoring/services/RiskEngine";
import {
  ProctoringFlagType,
  ProctoringSeverity,
} from "../../../modules/proctoring/types/proctoring.types";

describe("RiskEngine", () => {

  describe("weightOf", () => {

    it("matches the documented example weights", () => {

      expect(weightOf(ProctoringFlagType.NO_FACE_DETECTED)).toBe(5);
      expect(weightOf(ProctoringFlagType.LOOKING_AWAY)).toBe(3);
      expect(weightOf(ProctoringFlagType.PROHIBITED_OBJECT_DETECTED)).toBe(40);
      expect(weightOf(ProctoringFlagType.TAB_SWITCHED)).toBe(25);
      expect(weightOf(ProctoringFlagType.MULTIPLE_FACES_DETECTED)).toBe(60);

    });

    it("returns 0 for lifecycle/telemetry types not in the table", () => {

      expect(weightOf(ProctoringFlagType.CAMERA_STARTED)).toBe(0);
      expect(weightOf(ProctoringFlagType.PROCTORING_INIT_COMPLETED)).toBe(0);
      expect(weightOf(ProctoringFlagType.STRANGER_LEFT)).toBe(0);

    });

  });

  describe("computeRiskDelta", () => {

    it("sums weights across a batch of flags", () => {

      const delta = computeRiskDelta([
        { type: ProctoringFlagType.LOOKING_AWAY },
        { type: ProctoringFlagType.TAB_SWITCHED },
      ]);

      expect(delta).toBe(28);

    });

    it("returns 0 for an empty batch", () => {

      expect(computeRiskDelta([])).toBe(0);

    });

  });

  describe("computeRiskScore", () => {

    it("sums weights across full event history", () => {

      const score = computeRiskScore([
        { type: ProctoringFlagType.LOOKING_AWAY },
        { type: ProctoringFlagType.LOOKING_AWAY },
        { type: ProctoringFlagType.NO_FACE_DETECTED },
      ]);

      expect(score).toBe(11);

    });

    it("clamps at 100 even with a huge violation history", () => {

      const events = Array.from({ length: 10 }, () => ({
        type: ProctoringFlagType.PROHIBITED_OBJECT_DETECTED,
      }));

      expect(computeRiskScore(events)).toBe(100);

    });

    it("returns 0 for no events", () => {

      expect(computeRiskScore([])).toBe(0);

    });

  });

  describe("getRiskLevel", () => {

    it.each([
      [0, "low"],
      [24, "low"],
      [25, "medium"],
      [49, "medium"],
      [50, "high"],
      [74, "high"],
      [75, "critical"],
      [100, "critical"],
    ] as const)("classifies a score of %i as %s", (score, expectedLevel) => {

      expect(getRiskLevel(score)).toBe(expectedLevel);

    });

  });

  describe("getRecommendation", () => {

    it("returns a distinct, non-empty recommendation for every level", () => {

      const levels = ["low", "medium", "high", "critical"] as const;
      const recommendations = levels.map((level) => getRecommendation(level));

      expect(new Set(recommendations).size).toBe(levels.length);
      recommendations.forEach((text) => expect(text.length).toBeGreaterThan(0));

    });

  });

  describe("countViolations", () => {

    it("counts only events with nonzero risk weight", () => {

      const count = countViolations([
        { type: ProctoringFlagType.LOOKING_AWAY, severity: ProctoringSeverity.LOW },
        { type: ProctoringFlagType.CAMERA_STARTED, severity: ProctoringSeverity.INFO },
        { type: ProctoringFlagType.TAB_SWITCHED, severity: ProctoringSeverity.HIGH },
      ]);

      expect(count).toBe(2);

    });

  });

});
