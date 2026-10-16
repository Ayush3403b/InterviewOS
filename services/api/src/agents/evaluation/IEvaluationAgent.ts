import { InterviewSessionDocument } from "../../modules/interview-session/types/interview-session.types";
import { ConversationDocument } from "../../modules/conversation/types/conversation.types";

import { CompleteEvaluationDto } from "../../modules/evaluation/dtos/CompleteEvaluation.dto";

export interface IEvaluationAgent {
  evaluate(
    interview: InterviewSessionDocument,
    conversation: ConversationDocument[]
  ): Promise<CompleteEvaluationDto>;
}