import {
  CoachingInput,
  CoachingPlan,
  ICoachAgent,
  ResourceRecommendation,
  RoadmapItem,
} from "./ICoachAgent";

const SKILL_LABELS: Record<keyof CoachingInput["skillScores"], string> = {
  technical: "Technical depth",
  communication: "Communication",
  problemSolving: "Problem solving",
  confidence: "Confidence",
};

const RESOURCE_LIBRARY: Record<string, ResourceRecommendation> = {
  "Technical depth": {
    title: "Deepen core CS fundamentals (data structures & algorithms)",
    type: "COURSE",
    reason: "Technical score was the weakest area in this interview.",
  },
  "Communication": {
    title: "Practice structuring answers with the STAR method",
    type: "ARTICLE",
    reason: "Communication scored lower than other skill areas.",
  },
  "Problem solving": {
    title: "Timed problem-solving practice sets",
    type: "PRACTICE",
    reason: "Problem-solving score suggests more timed practice would help.",
  },
  "Confidence": {
    title: "Mock interview practice to build delivery confidence",
    type: "PRACTICE",
    reason: "Confidence scored lower relative to other areas.",
  },
};

const LOW_SCORE_THRESHOLD = 65;

/**
 * No AI call, no API key required. Purely derived from the evaluation's
 * own numbers and text - good enough to keep the coaching flow working
 * end-to-end when AI_EVALUATION_PROVIDER is "mock" or every real
 * provider is unavailable.
 */
export class MockCoachAgent implements ICoachAgent {
  async generateCoaching(input: CoachingInput): Promise<CoachingPlan> {
    const skillEntries = Object.entries(input.skillScores) as [
      keyof CoachingInput["skillScores"],
      number,
    ][];

    const weakSkillLabels = skillEntries
      .filter(([, score]) => score < LOW_SCORE_THRESHOLD)
      .sort((a, b) => a[1] - b[1])
      .map(([key]) => SKILL_LABELS[key]);

    const weakTopics = [
      ...weakSkillLabels,
      ...input.weaknesses.slice(0, 3),
    ];

    const learningRoadmap: RoadmapItem[] = weakSkillLabels.map(
      (label, index) => ({
        topic: label,
        action: RESOURCE_LIBRARY[label]?.title ?? `Focus on improving ${label.toLowerCase()}.`,
        priority: index === 0 ? "HIGH" : index === 1 ? "MEDIUM" : "LOW",
      })
    );

    if (learningRoadmap.length === 0) {
      learningRoadmap.push({
        topic: "Consistency",
        action: "Keep practicing regularly to maintain your current level.",
        priority: "LOW",
      });
    }

    const recommendedResources = weakSkillLabels
      .map((label) => RESOURCE_LIBRARY[label])
      .filter((resource): resource is ResourceRecommendation => Boolean(resource));

    if (recommendedResources.length === 0) {
      recommendedResources.push({
        title: "Advanced system design case studies",
        type: "COURSE",
        reason: "Solid overall performance - push into more advanced material.",
      });
    }

    const personalizedFeedback =
      weakSkillLabels.length > 0
        ? `You scored ${input.overallScore}/100 overall. Your strongest work was in ${
            skillEntries
              .sort((a, b) => b[1] - a[1])
              .slice(0, 1)
              .map(([key]) => SKILL_LABELS[key].toLowerCase())[0]
          }, and the clearest opportunity to improve is ${weakSkillLabels[0].toLowerCase()}.`
        : `You scored ${input.overallScore}/100 overall with no significant weak areas - solid, consistent performance.`;

    const careerGuidance =
      input.hiringRecommendation === "STRONG_HIRE" ||
      input.hiringRecommendation === "HIRE"
        ? "You're performing at a hireable level for this role and level - keep refining your weaker areas to widen the gap."
        : "Focus on the roadmap items below before your next interview attempt; they're the fastest path to a stronger outcome.";

    return {
      personalizedFeedback,
      weakTopics,
      learningRoadmap,
      recommendedResources,
      careerGuidance,
    };
  }
}
