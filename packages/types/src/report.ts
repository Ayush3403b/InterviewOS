export interface SkillScoresDto {
  technical: number;
  communication: number;
  problemSolving: number;
  confidence: number;
}

export interface QuestionEvaluationDto {
  turnNumber: number;
  question: string;
  category: string;
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export interface RoadmapItemDto {
  topic: string;
  action: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
}

export interface InterviewReportDto {
  id: string;
  interviewSessionId: string;
  candidateId: string;
  candidateName: string;
  interviewTitle: string;
  interviewType: string;
  interviewLevel: string;
  overallScore: number;
  skillScores: SkillScoresDto;
  hiringRecommendation: "STRONG_HIRE" | "HIRE" | "LEANING_HIRE" | "LEANING_NO_HIRE" | "NO_HIRE";
  executiveSummary: string;
  strengths: string[];
  weaknesses: string[];
  questionEvaluations: QuestionEvaluationDto[];
  learningRoadmap: RoadmapItemDto[];
  shareableToken?: string;
  createdAt: string;
}
