import { Document, Types } from "mongoose";

import {
  HiringRecommendation,
  QuestionEvaluation,
  SkillGap,
  SkillScores,
} from "../../evaluation/types/evaluation.types";
import {
  ResourceRecommendation,
  RoadmapItem,
} from "../../../agents/coach/ICoachAgent";

export interface ReportDocument extends Document {
  interviewSessionId: Types.ObjectId;
  userId: Types.ObjectId;
  evaluationId: Types.ObjectId;

  candidateName: string;
  interviewTitle: string;
  interviewType: string;
  interviewLevel: string;

  overallScore: number;
  skillScores: SkillScores;
  strengths: string[];
  weaknesses: string[];
  hiringRecommendation: HiringRecommendation;
  overallSummary: string;
  questionEvaluations: QuestionEvaluation[];

  /** Present only if a coaching plan existed at report-generation time. */
  weakTopics: string[];
  learningRoadmap: RoadmapItem[];
  recommendedResources: ResourceRecommendation[];

  /** Snapshotted from the evaluation. Present only for v2+ evaluations. */
  skillGaps: SkillGap[];

  executiveSummary: string;
  candidateFeedback: string;
  recruiterBrief: string;
  executiveDigest: string;

  /** Public sharing token for recruiter/hiring manager sharing without login. */
  shareToken?: string;
  isPublic?: boolean;
  shareExpiresAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}
