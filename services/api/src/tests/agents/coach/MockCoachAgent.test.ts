import { describe, expect, it } from "vitest";

import { MockCoachAgent } from "../../../agents/coach/MockCoachAgent";
import type { CoachingInput } from "../../../agents/coach/ICoachAgent";

const strongInput: CoachingInput = {
  overallScore: 90,
  skillScores: { technical: 92, communication: 88, problemSolving: 90, confidence: 85 },
  strengths: ["Clear communication", "Strong fundamentals"],
  weaknesses: [],
  overallSummary: "Excellent candidate across the board.",
  hiringRecommendation: "STRONG_HIRE",
  interviewType: "TECHNICAL",
  interviewLevel: "ADVANCED",
};

const weakInput: CoachingInput = {
  overallScore: 45,
  skillScores: { technical: 40, communication: 70, problemSolving: 50, confidence: 60 },
  strengths: ["Good communicator"],
  weaknesses: ["Struggled with recursion", "Didn't discuss trade-offs"],
  overallSummary: "Candidate needs significant technical improvement.",
  hiringRecommendation: "NO_HIRE",
  interviewType: "TECHNICAL",
  interviewLevel: "BEGINNER",
};

describe("MockCoachAgent", () => {

  it("identifies the lowest-scoring skill as the top weak topic", async () => {

    const agent = new MockCoachAgent();
    const result = await agent.generateCoaching(weakInput);

    expect(result.weakTopics[0]).toBe("Technical depth");
    expect(result.learningRoadmap[0].topic).toBe("Technical depth");
    expect(result.learningRoadmap[0].priority).toBe("HIGH");

  });

  it("includes evaluation weaknesses in weakTopics alongside skill gaps", async () => {

    const agent = new MockCoachAgent();
    const result = await agent.generateCoaching(weakInput);

    expect(result.weakTopics).toEqual(
      expect.arrayContaining(["Struggled with recursion", "Didn't discuss trade-offs"])
    );

  });

  it("recommends at least one resource even with no weak skills", async () => {

    const agent = new MockCoachAgent();
    const result = await agent.generateCoaching(strongInput);

    expect(result.recommendedResources.length).toBeGreaterThan(0);
    expect(result.learningRoadmap.length).toBeGreaterThan(0);

  });

  it("gives encouraging career guidance for a strong hire recommendation", async () => {

    const agent = new MockCoachAgent();
    const result = await agent.generateCoaching(strongInput);

    expect(result.careerGuidance).toMatch(/hireable|refining/i);

  });

  it("gives roadmap-focused career guidance for a no-hire recommendation", async () => {

    const agent = new MockCoachAgent();
    const result = await agent.generateCoaching(weakInput);

    expect(result.careerGuidance).toMatch(/roadmap/i);

  });

  it("always returns a non-empty personalizedFeedback string", async () => {

    const agent = new MockCoachAgent();
    const result = await agent.generateCoaching(strongInput);

    expect(result.personalizedFeedback.length).toBeGreaterThan(0);
    expect(result.personalizedFeedback).toContain("90/100");

  });

});
