import {
  IPlannerAgent,
  PlannerDecision,
  PlannerProctoringSummary,
} from "./IPlannerAgent";

import { InterviewSessionDocument } from "../../modules/interview-session/types/interview-session.types";
import { ConversationDocument } from "../../modules/conversation/types/conversation.types";
import { InterviewContextDocument } from "../../modules/interview-context/types/interview-context.types";

/**
 * Risk score (0-100, see the proctoring module's RiskEngine) at or
 * above this ends the interview immediately, regardless of question
 * budget - continuing to interview someone the system already has
 * strong evidence against just extends a session likely headed for
 * disqualification anyway. This threshold matches RiskEngine's own
 * "critical" tier for consistency between what the report calls
 * critical and what the planner acts on.
 */
const CRITICAL_RISK_THRESHOLD = 75;

/** Never wrap up early on a struggle streak before this many questions. */
const MIN_QUESTIONS_BEFORE_EARLY_WRAP_UP = 3;

/** How many consecutive recent answers must all be low to trigger it. */
const CONSECUTIVE_LOW_SCORES_FOR_EARLY_WRAP_UP = 3;

/** answerQuality at/below this counts as "struggling" for that check. */
const LOW_SCORE_THRESHOLD = 25;

/**
 * Rule-based planner with two modes:
 *
 * 1. **Section-aware mode** (when `interview.sectionPlan` is set):
 *    Advances through sections in order (intro → behavioral → technical →
 *    wrap-up), honouring each section's `maxQuestions` budget. Emits
 *    `currentSection` so the Question Agent knows which section it is in.
 *    Sections transition automatically when their budget is exhausted.
 *    WRAP_UP fires when the final section's budget is also exhausted.
 *
 * 2. **Flat-budget mode** (no sectionPlan):
 *    Original behaviour — question count vs `interview.maxQuestions`.
 *    Fully backward-compatible; nothing changed here.
 *
 * Both modes share:
 * - Critical-risk proctoring cutoff (terminates immediately).
 * - Consistent-struggle early wrap-up (after 3 consecutive low-quality
 *   answers, before the budget is reached).
 */
export class RulePlannerAgent implements IPlannerAgent {
  async decideNextAction(
    interview: InterviewSessionDocument,
    context: InterviewContextDocument | null,
    previousTurns: ConversationDocument[],
    proctoringSummary?: PlannerProctoringSummary | null
  ): Promise<PlannerDecision> {
    const criticalRiskDecision = this.checkProctoringRisk(proctoringSummary);
    if (criticalRiskDecision) {
      return criticalRiskDecision;
    }

    const answeredCount = previousTurns.filter(
      (turn) => turn.answer && turn.answer.trim().length > 0
    ).length;

    // ── Section-aware mode ─────────────────────────────────────────────────
    if (interview.sectionPlan && interview.sectionPlan.length > 0) {
      return this.decideSectionAction(
        interview,
        context,
        answeredCount
      );
    }

    // ── Flat-budget mode ───────────────────────────────────────────────────
    if (answeredCount >= interview.maxQuestions) {
      return {
        action: "WRAP_UP",
        reason: `Reached the question budget (${answeredCount}/${interview.maxQuestions}).`,
      };
    }

    const strugglingDecision = this.checkConsistentStruggle(
      context,
      answeredCount
    );
    if (strugglingDecision) {
      return strugglingDecision;
    }

    return {
      action: "ASK_QUESTION",
      reason: `${answeredCount}/${interview.maxQuestions} questions answered so far.`,
    };
  }

  // ── Section helpers ────────────────────────────────────────────────────────

  private decideSectionAction(
    interview: InterviewSessionDocument,
    context: InterviewContextDocument | null,
    answeredCount: number
  ): PlannerDecision {
    const plan = interview.sectionPlan!;

    // Find the current active section (first one not yet exhausted).
    let cumulative = 0;
    for (const section of plan) {
      cumulative += section.maxQuestions;
      if (answeredCount < cumulative) {
        // We're still inside this section's budget.
        const answeredInSection =
          answeredCount - (cumulative - section.maxQuestions);

        const strugglingDecision = this.checkConsistentStruggle(
          context,
          answeredCount
        );
        if (strugglingDecision) {
          return strugglingDecision;
        }

        return {
          action: "ASK_QUESTION",
          reason: `Section "${section.name}": ${answeredInSection}/${section.maxQuestions} questions answered.`,
          currentSection: section.name,
        };
      }
    }

    // All sections exhausted.
    return {
      action: "WRAP_UP",
      reason: `All ${plan.length} interview sections completed (${answeredCount} total questions).`,
    };
  }

  // ── Shared helpers ─────────────────────────────────────────────────────────

  /**
   * A missing summary (no proctoring session, or the lookup failed)
   * is never treated as a violation - only an explicit critical-risk
   * or terminated status short-circuits the normal flow.
   */
  private checkProctoringRisk(
    summary?: PlannerProctoringSummary | null
  ): PlannerDecision | null {
    if (!summary) {
      return null;
    }

    if (summary.status === "TERMINATED") {
      return {
        action: "WRAP_UP",
        reason: "Proctoring terminated this session.",
      };
    }

    if (summary.riskScore >= CRITICAL_RISK_THRESHOLD) {
      return {
        action: "WRAP_UP",
        reason: `Proctoring flagged this session as critical risk (${summary.riskScore}/100) - ending early for manual review.`,
      };
    }

    return null;
  }

  private checkConsistentStruggle(
    context: InterviewContextDocument | null,
    answeredCount: number
  ): PlannerDecision | null {
    const qualityHistory = context?.answerQualityHistory ?? [];

    if (
      answeredCount < MIN_QUESTIONS_BEFORE_EARLY_WRAP_UP ||
      qualityHistory.length < CONSECUTIVE_LOW_SCORES_FOR_EARLY_WRAP_UP
    ) {
      return null;
    }

    const recent = qualityHistory.slice(
      -CONSECUTIVE_LOW_SCORES_FOR_EARLY_WRAP_UP
    );
    const consistentlyStruggling = recent.every(
      (score) => score <= LOW_SCORE_THRESHOLD
    );

    if (!consistentlyStruggling) {
      return null;
    }

    return {
      action: "WRAP_UP",
      reason: `Wrapping up early - the last ${recent.length} answers scored ${recent.join(", ")}/100, consistently at or below ${LOW_SCORE_THRESHOLD}.`,
    };
  }
}
