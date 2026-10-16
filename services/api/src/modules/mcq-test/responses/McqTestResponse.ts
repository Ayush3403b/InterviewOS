import { getRiskLevel } from "../../proctoring/services/RiskEngine";
import { ProctoringSessionDocument } from "../../proctoring/types/proctoring.types";

import { AttemptCounts } from "../repositories/McqAttemptRepository";
import { answersRecord } from "../services/attemptScoring";

import {
  McqAttemptDocument,
  McqAttemptResult,
  McqAttemptStatus,
  McqTestDocument,
  McqTestStatus,
} from "../types/mcq-test.types";

interface CandidateRef {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
}

/** candidateId is populated on listing/review reads, a bare id otherwise. */
function candidateOf(attempt: McqAttemptDocument): CandidateRef {
  const raw = attempt.candidateId as unknown;

  if (raw && typeof raw === "object" && "firstName" in (raw as Record<string, unknown>)) {
    const user = raw as {
      _id: { toString(): string };
      firstName: string;
      lastName: string;
      email?: string;
      avatar?: string;
    };

    return {
      id: user._id.toString(),
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      avatar: user.avatar,
    };
  }

  return { id: String(raw), name: "Unknown candidate" };
}

function totalPoints(test: McqTestDocument): number {
  return test.questions.reduce((sum, question) => sum + (question.points ?? 1), 0);
}

export class McqTestResponse {
  /* -------------------------------------------------------------------------- */
  /*                                Author views                                 */
  /* -------------------------------------------------------------------------- */

  static toTestSummary(test: McqTestDocument, counts: AttemptCounts) {
    return {
      id: test._id.toString(),
      title: test.title,
      status: test.status,
      durationMinutes: test.durationMinutes,
      questionCount: test.questions.length,
      totalPoints: totalPoints(test),
      accessCode: test.accessCode ?? null,
      attemptCount: counts.total,
      submittedCount: counts.submitted,
      publishedAt: test.publishedAt ?? null,
      closedAt: test.closedAt ?? null,
      createdAt: test.createdAt,
      updatedAt: test.updatedAt,
    };
  }

  /** Includes the answer key - authors only. */
  static toTestDetail(test: McqTestDocument, counts: AttemptCounts) {
    return {
      ...this.toTestSummary(test, counts),
      description: test.description ?? "",
      instructions: test.instructions ?? "",
      passPercentage: test.passPercentage,
      shuffleQuestions: test.shuffleQuestions,
      shuffleOptions: test.shuffleOptions,
      showScoreToCandidate: test.showScoreToCandidate,
      questions: test.questions.map((question) => ({
        id: question._id.toString(),
        text: question.text,
        options: question.options,
        correctOptionIndex: question.correctOptionIndex,
        explanation: question.explanation ?? "",
        topic: question.topic ?? "",
        difficulty: question.difficulty,
        points: question.points,
        source: question.source,
      })),
    };
  }

  static toResultRow(
    attempt: McqAttemptDocument,
    proctoring: ProctoringSessionDocument | null
  ) {
    return {
      id: attempt._id.toString(),
      candidate: candidateOf(attempt),
      status: attempt.status,
      startedAt: attempt.startedAt,
      deadlineAt: attempt.deadlineAt,
      submittedAt: attempt.submittedAt ?? null,
      submitReason: attempt.submitReason ?? null,
      result: attempt.result ?? null,
      proctoring: proctoring
        ? {
            status: proctoring.status,
            trustScore: proctoring.trustScore,
            riskScore: proctoring.riskScore,
            riskLevel: getRiskLevel(proctoring.riskScore),
          }
        : null,
    };
  }

  /** Every question with the candidate's choice and the right answer. */
  static toAttemptReview(test: McqTestDocument, attempt: McqAttemptDocument) {
    const selected = answersRecord(attempt.answers);

    return {
      ...this.toResultRow(attempt, null),
      testId: test._id.toString(),
      testTitle: test.title,
      passPercentage: attempt.passPercentage,
      questions: attempt.questions.map((question, index) => {
        const choice = selected[question.questionId.toString()];

        return {
          number: index + 1,
          questionId: question.questionId.toString(),
          text: question.text,
          options: question.options,
          correctOptionIndex: question.correctOptionIndex,
          selectedOptionIndex: choice ?? null,
          isCorrect: choice === question.correctOptionIndex,
          points: question.points,
          topic: question.topic ?? "",
          explanation: question.explanation ?? "",
        };
      }),
    };
  }

  /* -------------------------------------------------------------------------- */
  /*                               Candidate views                               */
  /*            Never include correctOptionIndex or explanations.               */
  /* -------------------------------------------------------------------------- */

  static toTestPreview(test: McqTestDocument, myAttempt: McqAttemptDocument | null) {
    return {
      title: test.title,
      description: test.description ?? "",
      instructions: test.instructions ?? "",
      durationMinutes: test.durationMinutes,
      questionCount: test.questions.length,
      acceptingAttempts: test.status === McqTestStatus.PUBLISHED,
      myAttempt: myAttempt
        ? { id: myAttempt._id.toString(), status: myAttempt.status }
        : null,
    };
  }

  private static candidateResult(attempt: McqAttemptDocument): McqAttemptResult | null {
    return attempt.showScoreToCandidate ? (attempt.result ?? null) : null;
  }

  /**
   * In progress: the questions (in this candidate's order, options
   * shuffled but tagged with their original index), their saved
   * answers, and the server's clock for an accurate countdown.
   * Submitted: just the outcome - and the score only if the author
   * chose to show it.
   */
  static toCandidateAttempt(attempt: McqAttemptDocument) {
    const inProgress = attempt.status === McqAttemptStatus.IN_PROGRESS;

    return {
      id: attempt._id.toString(),
      testTitle: attempt.testTitle,
      status: attempt.status,
      startedAt: attempt.startedAt,
      deadlineAt: attempt.deadlineAt,
      serverNow: new Date(),
      submittedAt: attempt.submittedAt ?? null,
      submitReason: attempt.submitReason ?? null,
      questionCount: attempt.questions.length,
      questions: inProgress
        ? attempt.questions.map((question) => ({
            id: question.questionId.toString(),
            text: question.text,
            points: question.points,
            options: question.optionOrder.map((index) => ({
              index,
              text: question.options[index],
            })),
          }))
        : [],
      answers: inProgress ? answersRecord(attempt.answers) : {},
      result: this.candidateResult(attempt),
    };
  }

  static toMyAttemptSummary(attempt: McqAttemptDocument) {
    return {
      id: attempt._id.toString(),
      testTitle: attempt.testTitle,
      status: attempt.status,
      startedAt: attempt.startedAt,
      deadlineAt: attempt.deadlineAt,
      submittedAt: attempt.submittedAt ?? null,
      result: this.candidateResult(attempt),
    };
  }
}
