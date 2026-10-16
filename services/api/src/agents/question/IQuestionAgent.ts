import { InterviewSessionDocument } from "../../modules/interview-session/types/interview-session.types";
import { ConversationDocument } from "../../modules/conversation/types/conversation.types";
import { InterviewContextDocument } from "../../modules/interview-context/types/interview-context.types";
import { SectionName } from "../../modules/interview-session/types/interview-session.types";

export interface GeneratedQuestion {
  question: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  isFollowUp: boolean;
  topic: string;
  rationale: string;
}

export interface IQuestionAgent {
  generateNextQuestion(
    interview: InterviewSessionDocument,
    context: InterviewContextDocument | null,
    previousTurns: ConversationDocument[],
    currentSection?: SectionName
  ): Promise<GeneratedQuestion>;
}

