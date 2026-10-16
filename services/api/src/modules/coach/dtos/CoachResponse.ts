import {
  ResourceRecommendation,
  RoadmapItem,
} from "../../../agents/coach/ICoachAgent";
import { CoachingPlanDocument } from "../types/coach.types";

export interface CoachingPlanResponseDto {
  id: string;
  interviewSessionId: string;
  personalizedFeedback: string;
  weakTopics: string[];
  learningRoadmap: RoadmapItem[];
  recommendedResources: ResourceRecommendation[];
  careerGuidance: string;
  createdAt: Date;
}

export function toCoachingPlanResponse(
  plan: CoachingPlanDocument
): CoachingPlanResponseDto {
  return {
    id: plan.id,
    interviewSessionId: plan.interviewSessionId.toString(),
    personalizedFeedback: plan.personalizedFeedback,
    weakTopics: plan.weakTopics,
    learningRoadmap: plan.learningRoadmap,
    recommendedResources: plan.recommendedResources,
    careerGuidance: plan.careerGuidance,
    createdAt: plan.createdAt,
  };
}
