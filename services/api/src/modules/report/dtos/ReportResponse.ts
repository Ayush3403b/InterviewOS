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
import { ReportDocument } from "../types/report.types";

export interface ReportResponseDto {
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
  hiringRecommendation: HiringRecommendation;
  overallSummary: string;
  questionEvaluations: QuestionEvaluation[];
  weakTopics: string[];
  learningRoadmap: RoadmapItem[];
  recommendedResources: ResourceRecommendation[];
  /** v2+ only — empty array on older reports. */
  skillGaps: SkillGap[];
  executiveSummary: string;
  candidateFeedback: string;
  recruiterBrief: string;
  executiveDigest: string;
  shareToken?: string;
  isPublic?: boolean;
  shareExpiresAt?: Date;
  createdAt: Date;
}

export function toReportResponse(report: ReportDocument): ReportResponseDto {
  return {
    id: report.id,
    interviewSessionId: report.interviewSessionId.toString(),
    candidateName: report.candidateName,
    interviewTitle: report.interviewTitle,
    interviewType: report.interviewType,
    interviewLevel: report.interviewLevel,
    overallScore: report.overallScore,
    skillScores: report.skillScores,
    strengths: report.strengths,
    weaknesses: report.weaknesses,
    hiringRecommendation: report.hiringRecommendation,
    overallSummary: report.overallSummary,
    questionEvaluations: report.questionEvaluations,
    weakTopics: report.weakTopics,
    learningRoadmap: report.learningRoadmap,
    recommendedResources: report.recommendedResources,
    skillGaps: report.skillGaps ?? [],
    executiveSummary: report.executiveSummary,
    candidateFeedback: report.candidateFeedback,
    recruiterBrief: report.recruiterBrief,
    executiveDigest: report.executiveDigest,
    shareToken: report.shareToken,
    isPublic: report.isPublic,
    shareExpiresAt: report.shareExpiresAt,
    createdAt: report.createdAt,
  };
}
