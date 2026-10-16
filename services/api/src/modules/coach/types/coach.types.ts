import { Document, Types } from "mongoose";

import {
  ResourceRecommendation,
  RoadmapItem,
} from "../../../agents/coach/ICoachAgent";

export interface CoachingPlanDocument extends Document {
  interviewSessionId: Types.ObjectId;
  userId: Types.ObjectId;
  evaluationId: Types.ObjectId;
  personalizedFeedback: string;
  weakTopics: string[];
  learningRoadmap: RoadmapItem[];
  recommendedResources: ResourceRecommendation[];
  careerGuidance: string;
  createdAt: Date;
  updatedAt: Date;
}
