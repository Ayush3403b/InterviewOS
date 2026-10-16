import { InterviewSessionDocument } from "../../modules/interview-session/types/interview-session.types";
import { ConversationDocument } from "../../modules/conversation/types/conversation.types";
import { InterviewContextDocument } from "../../modules/interview-context/types/interview-context.types";
import { SectionName } from "../../modules/interview-session/types/interview-session.types";

export type PlannerAction = "ASK_QUESTION" | "WRAP_UP";

export interface PlannerDecision {
  action: PlannerAction;
  reason: string;
  /** Present when action is ASK_QUESTION and a section plan is active. */
  currentSection?: SectionName;
}

/**
 * Deliberately minimal - just what a planner needs to make a macro
 * flow call, not the full ProctoringSessionDocument. Keeps this
 * agent decoupled from the proctoring module's internal shape; the
 * orchestrator is responsible for mapping one to the other.
 */
export interface PlannerProctoringSummary {
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  status: "ACTIVE" | "FLAGGED" | "COMPLETED" | "TERMINATED";
}

/**
 * Decides the interview's macro-level flow (keep going vs wrap up)
 * so that decision doesn't live as a fixed `turnCount >= maxQuestions`
 * check scattered across the orchestrator. Per-question difficulty
 * and follow-up decisions are the Question Agent's job - the Planner
 * owns the higher-level "should this interview continue" call.
 *
 * `proctoringSummary` is optional/undefined for non-proctored
 * interviews or if the lookup fails - implementations must treat a
 * missing summary as "nothing to factor in," never as a violation.
 */
export interface IPlannerAgent {
  decideNextAction(
    interview: InterviewSessionDocument,
    context: InterviewContextDocument | null,
    previousTurns: ConversationDocument[],
    proctoringSummary?: PlannerProctoringSummary | null
  ): Promise<PlannerDecision>;
}
