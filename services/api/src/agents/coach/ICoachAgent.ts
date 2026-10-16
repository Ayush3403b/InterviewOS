export type RoadmapPriority = "HIGH" | "MEDIUM" | "LOW";

export interface RoadmapItem {
  topic: string;
  action: string;
  priority: RoadmapPriority;
}

export type ResourceType = "COURSE" | "ARTICLE" | "PRACTICE" | "VIDEO";

export interface ResourceRecommendation {
  title: string;
  type: ResourceType;
  reason: string;
  url?: string;
}

export interface CoachingPlan {
  personalizedFeedback: string;
  weakTopics: string[];
  learningRoadmap: RoadmapItem[];
  recommendedResources: ResourceRecommendation[];
  careerGuidance: string;
}

/**
 * Input the Coach Agent reasons over - deliberately just the fields it
 * actually needs from an evaluation, not the whole EvaluationDocument,
 * so the agent doesn't depend on Mongoose types.
 */
export interface CoachingInput {
  overallScore: number;
  skillScores: {
    technical: number;
    communication: number;
    problemSolving: number;
    confidence: number;
  };
  strengths: string[];
  weaknesses: string[];
  overallSummary: string;
  hiringRecommendation: string;
  interviewType: string;
  interviewLevel: string;
}

export interface ICoachAgent {
  generateCoaching(input: CoachingInput): Promise<CoachingPlan>;
}
