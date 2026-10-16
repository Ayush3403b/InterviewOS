import type { RoadmapItem, ResourceRecommendation } from "../coach/types";

export interface SkillScores {
  technical: number;
  communication: number;
  problemSolving: number;
  confidence: number;
  /** v2+ evaluation only — will be 0 on older reports. */
  leadership: number;
  criticalThinking: number;
}

export interface SkillGap {
  skill: string;
  currentLevel: number;
  targetLevel: number;
  priority: "high" | "medium" | "low";
  actionableSteps: string[];
}

export interface QuestionEvaluation {
  turnNumber: number;
  question: string;
  answer: string;
  score: number;
  feedback: string;
}

/** Mirrors ReportResponseDto (modules/report/dtos/ReportResponse.ts). */
export interface InterviewReport {
  id: string;
  interviewSessionId: string;
  candidateName: string;
  interviewTitle: string;
  interviewType: string;
  interviewLevel: string;
  overallScore: number;
  skillScores: SkillScores;
  strengths: string[];
  weaknesses: string[];
  hiringRecommendation: string;
  overallSummary: string;
  questionEvaluations: QuestionEvaluation[];
  weakTopics: string[];
  learningRoadmap: RoadmapItem[];
  recommendedResources: ResourceRecommendation[];
  /** v2+ only \u2014 empty array on older reports. */
  skillGaps: SkillGap[];
  executiveSummary: string;
  /** v2+ report only \u2014 empty string on older reports. */
  candidateFeedback: string;
  recruiterBrief: string;
  executiveDigest: string;
  shareToken?: string;
  isPublic?: boolean;
  shareExpiresAt?: string;
  createdAt: string;
}
