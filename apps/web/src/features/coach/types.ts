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

/** Mirrors CoachingPlanResponseDto (modules/coach/dtos/CoachResponse.ts). */
export interface CoachingPlan {
  id: string;
  interviewSessionId: string;
  personalizedFeedback: string;
  weakTopics: string[];
  learningRoadmap: RoadmapItem[];
  recommendedResources: ResourceRecommendation[];
  careerGuidance: string;
  createdAt: string;
}
