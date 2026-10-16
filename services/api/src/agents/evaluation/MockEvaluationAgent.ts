import { IEvaluationAgent } from "./IEvaluationAgent";

import { InterviewSessionDocument } from "../../modules/interview-session/types/interview-session.types";
import { ConversationDocument } from "../../modules/conversation/types/conversation.types";

import { CompleteEvaluationDto } from "../../modules/evaluation/dtos/CompleteEvaluation.dto";
import { HiringRecommendation } from "../../modules/evaluation/types/evaluation.types";

export class MockEvaluationAgent implements IEvaluationAgent {
  async evaluate(
    interview: InterviewSessionDocument,
    conversation: ConversationDocument[]
  ): Promise<CompleteEvaluationDto> {
    return {
      overallScore: 85,

      skillScores: {
        technical: 82,
        communication: 85,
        problemSolving: 88,
        confidence: 84,
        leadership: 75,
        criticalThinking: 80,
      },

      strengths: [
        "Good communication",
        "Strong problem solving",
      ],

      weaknesses: [
        "Needs deeper technical explanations",
      ],

      recommendations: [
        "Practice more system design questions",
      ],

      overallSummary:
        "The candidate demonstrated good communication and analytical ability. Technical depth can be improved.",

      hiringRecommendation:
        HiringRecommendation.HIRE,

      questionEvaluations: [],

      skillGaps: [],

      metadata: {
        provider: "Mock",
        model: "MockEvaluationAgent",
        promptVersion: "v2",
        latencyMs: 0,
        tokensUsed: 0,
      },
    };
  }
}