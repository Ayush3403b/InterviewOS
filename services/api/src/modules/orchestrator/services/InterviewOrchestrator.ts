import { Types } from "mongoose";

import { ApiError } from "../../../shared/errors/ApiError";
import { ErrorCode } from "../../../shared/errors/ErrorCode";
import { logger } from "../../../shared/logger/logger";

import InterviewSessionService from "../../interview-session/services/InterviewSessionService";
import ConversationService from "../../conversation/services/ConversationService";
import InterviewContextService from "../../interview-context/services/InterviewContextService";
import EvaluationService from "../../evaluation/services/EvaluationService";

import { InterviewStatus } from "../../interview-session/types/interview-session.types";

import { ConversationRole, ConversationStatus } from "../../conversation/types/conversation.types";

import { IQuestionAgent } from "../../../agents/question/IQuestionAgent";
import { IConversationAgent } from "../../../agents/conversation/IConversationAgent";
import { IPlannerAgent } from "../../../agents/planner/IPlannerAgent";
import type { PlannerProctoringSummary } from "../../../agents/planner/IPlannerAgent";
import { MockQuestionAgent } from "../../../agents/question/MockQuestionAgent";
import { MockConversationAgent } from "../../../agents/conversation/MockConversationAgent";

import { ProctoringSessionRepository } from "../../proctoring/repositories/ProctoringSessionRepository";
import { getRiskLevel } from "../../proctoring/services/RiskEngine";

import { ResumeRepository } from "../../resume/repositories/ResumeRepository";

export interface NextQuestionResult {
  done: boolean;
  reason?: string;
  turn?: {
    id: string;
    turnNumber: number;
    question: string;
    difficulty: string;
    isFollowUp: boolean;
    topic: string;
  };
}

export interface SubmitAnswerResult {
  turnId: string;
  topicsCovered: string[];
  transcriptSummary: string;
}

/**
 * ================================================================
 * Interview Orchestrator
 * ================================================================
 *
 *   Interview Session
 *          |
 *          v
 *   Agent Orchestrator  <-- you are here
 *          |
 *    +-----+------+------------+
 *    v            v            v
 * Planner    Question      Conversation
 * Agent        Agent          Agent
 *    \            |            /
 *     \___________|___________/
 *                 v
 *          (on finish) Evaluation Agent
 *
 * Callers (the live interview room) talk to this instead of manually
 * sequencing "create a turn, then update it, then remember to update
 * context, then remember to create+generate an evaluation." Each
 * individual module/endpoint this delegates to still works fine on
 * its own - this only adds a coordinated path on top.
 *
 * Real agents can fail (network issues, a bad AI response). Rather
 * than surface that as an interview-ending error, question/summary
 * generation falls back to the deterministic Mock agents so the
 * interview can always continue - see the try/catch in each method.
 */
export class InterviewOrchestrator {
  private readonly fallbackQuestionAgent = new MockQuestionAgent();
  private readonly fallbackConversationAgent = new MockConversationAgent();

  constructor(
    private readonly interviewSessionService: InterviewSessionService,
    private readonly conversationService: ConversationService,
    private readonly interviewContextService: InterviewContextService,
    private readonly evaluationService: EvaluationService,
    private readonly questionAgent: IQuestionAgent,
    private readonly conversationAgent: IConversationAgent,
    private readonly plannerAgent: IPlannerAgent,
    /** Optional so existing tests/wiring that don't care about
     *  proctoring don't need to construct one just to satisfy this
     *  constructor - see getProctoringSummary's null-safety below. */
    private readonly proctoringSessionRepository?: ProctoringSessionRepository,
    private readonly resumeRepository?: ResumeRepository
  ) {}

  /**
   * Blocks question generation/answer submission on anything but an
   * actively-running interview - a PAUSED session shouldn't silently
   * keep producing questions, and a COMPLETED/CANCELLED/EXPIRED one
   * definitely shouldn't accept new answers.
   */
  private ensureInProgress(status: InterviewStatus): void {
    if (status !== InterviewStatus.IN_PROGRESS) {
      throw new ApiError(
        409,
        `This interview is ${status.toLowerCase().replace("_", " ")}, not in progress.`,
        ErrorCode.CONFLICT
      );
    }
  }

  /**
   * Best-effort, read-only lookup - a missing proctoring session
   * shouldn't break the question loop.
   */
  private async getProctoringSummary(
    interviewSessionId: string
  ): Promise<PlannerProctoringSummary | null> {
    if (!this.proctoringSessionRepository) {
      return null;
    }

    try {
      const session = await this.proctoringSessionRepository.findBySubject(
        interviewSessionId
      );

      if (!session) {
        return null;
      }

      return {
        riskScore: session.riskScore,
        riskLevel: getRiskLevel(session.riskScore),
        status: session.status as PlannerProctoringSummary["status"],
      };
    } catch (error) {
      logger.warn(
        `Proctoring summary lookup failed, continuing without it: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return null;
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                             Get Next Question                              */
  /* -------------------------------------------------------------------------- */

  /**
   * Generates the next question using Planner -> Question agents.
   */
  public async getNextQuestion(
    sessionId: string,
    userId: string
  ): Promise<NextQuestionResult> {
    const interview = await this.interviewSessionService.getSessionById(
      sessionId,
      userId
    );

    this.ensureInProgress(interview.status);

    const previousTurns =
      await this.conversationService.getConversationHistory(sessionId);

    // If the latest turn is already PENDING and unanswered (e.g. from page reload or retry), reuse it
    const latestPendingTurn = previousTurns[previousTurns.length - 1];
    if (
      latestPendingTurn &&
      latestPendingTurn.status === ConversationStatus.PENDING &&
      (!latestPendingTurn.answer || latestPendingTurn.answer.trim().length === 0)
    ) {
      return {
        done: false,
        turn: {
          id: latestPendingTurn.id,
          turnNumber: latestPendingTurn.turnNumber,
          question: latestPendingTurn.question,
          difficulty:
            (latestPendingTurn.metadata?.difficulty as string) ?? "INTERMEDIATE",
          isFollowUp: latestPendingTurn.metadata?.isFollowUp === true,
          topic: (latestPendingTurn.metadata?.topic as string) ?? "General",
        },
      };
    }

    const context = await this.interviewContextService.getOrCreate(
      sessionId
    );

    // Auto-link candidate's latest profile resume if not yet attached to context
    if (!context.resumeSummary && this.resumeRepository) {
      try {
        const latestResume = await this.resumeRepository.findLatestByUser(
          interview.userId
        );
        if (latestResume?.summary) {
          await this.interviewContextService.setResumeSummary(
            sessionId,
            latestResume.summary
          );
          context.resumeSummary = latestResume.summary;
        }
      } catch (err) {
        logger.warn(
          `Could not auto-link profile resume for session ${sessionId}: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
    }

    const proctoringSummary = await this.getProctoringSummary(sessionId);

    const decision = await this.plannerAgent.decideNextAction(
      interview,
      context,
      previousTurns,
      proctoringSummary
    );

    if (decision.action === "WRAP_UP") {
      return { done: true, reason: decision.reason };
    }

    let generated;

    try {
      generated = await this.questionAgent.generateNextQuestion(
        interview,
        context,
        previousTurns,
        decision.currentSection
      );
    } catch (error) {
      logger.warn(
        `Question agent failed, falling back to deterministic questions: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      generated = await this.fallbackQuestionAgent.generateNextQuestion(
        interview,
        context,
        previousTurns,
        decision.currentSection
      );
    }

    const turn = await this.conversationService.createTurn({
      sessionId,
      turnNumber: previousTurns.length + 1,
      role: ConversationRole.AI,
      question: generated.question,
      status: ConversationStatus.PENDING,
      metadata: {
        difficulty: generated.difficulty,
        topic: generated.topic,
        isFollowUp: generated.isFollowUp,
        rationale: generated.rationale,
      },
    });

    return {
      done: false,
      turn: {
        id: turn.id,
        turnNumber: turn.turnNumber,
        question: turn.question,
        difficulty: generated.difficulty,
        isFollowUp: generated.isFollowUp,
        topic: generated.topic,
      },
    };
  }

  async submitAnswer(
    turnId: string,
    answer: string,
    timeTaken: number | undefined,
    sessionId: string,
    userId: string
  ): Promise<SubmitAnswerResult> {
    const interview = await this.interviewSessionService.getSessionById(
      sessionId,
      userId
    );

    this.ensureInProgress(interview.status);

    const turn = await this.conversationService.updateAnswer(
      turnId,
      answer,
      timeTaken
    );

    const context = await this.interviewContextService.getOrCreate(
      sessionId
    );

    let summaryResult;

    try {
      summaryResult = await this.conversationAgent.summarizeTurn(
        context.transcriptSummary,
        turn.question,
        answer
      );
    } catch (error) {
      logger.warn(
        `Conversation agent failed, falling back to a simple summary: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      summaryResult = await this.fallbackConversationAgent.summarizeTurn(
        context.transcriptSummary,
        turn.question,
        answer
      );
    }

    const topic =
      typeof turn.metadata?.topic === "string" ? turn.metadata.topic : undefined;
    const difficulty =
      typeof turn.metadata?.difficulty === "string"
        ? turn.metadata.difficulty
        : "UNKNOWN";
    const isFollowUp = turn.metadata?.isFollowUp === true;

    const updatedContext = await this.interviewContextService.appendTurn(
      sessionId,
      {
        transcriptSummary: summaryResult.summary,
        newTopics: [...summaryResult.newTopics, ...(topic ? [topic] : [])],
        difficultyUsed: difficulty,
        answerQuality: summaryResult.answerQuality,
        note: isFollowUp ? `Follow-up on turn ${turn.turnNumber}` : undefined,
      }
    );

    return {
      turnId: turn.id,
      topicsCovered: updatedContext.topicsCovered,
      transcriptSummary: updatedContext.transcriptSummary,
    };
  }

  async finishInterview(
    sessionId: string,
    userId: string,
    durationSeconds: number
  ) {
    if (!Types.ObjectId.isValid(sessionId)) {
      throw new ApiError(400, "Invalid interview session id.", ErrorCode.BAD_REQUEST);
    }

    const existing = await this.evaluationService.getEvaluationByInterview(
      sessionId
    );

    const evaluation =
      existing ??
      (await this.evaluationService.createEvaluation({
        interviewSessionId: new Types.ObjectId(sessionId),
        candidateId: new Types.ObjectId(userId),
      }));

    const generated = await this.evaluationService.generateEvaluation(
      evaluation.id
    );

    await this.interviewSessionService.completeSession(
      sessionId,
      userId,
      generated.overallScore,
      generated.overallSummary,
      durationSeconds
    );

    await this.closeProctoringSession(sessionId);

    return generated;
  }

  /**
   * Ends the interview's proctoring session so its report gets an end
   * time/duration. Best-effort, same as getProctoringSummary - a
   * proctoring hiccup must never fail an already-completed interview.
   */
  private async closeProctoringSession(interviewSessionId: string) {
    if (!this.proctoringSessionRepository) {
      return;
    }

    try {
      const session = await this.proctoringSessionRepository.findBySubject(
        interviewSessionId
      );

      if (session) {
        await this.proctoringSessionRepository.markCompleted(session._id);
      }
    } catch (error) {
      logger.warn(
        `Closing the proctoring session failed, continuing without it: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
