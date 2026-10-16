import { Types } from "mongoose";

import { ApiError } from "../../../shared/errors/ApiError";
import { ErrorCode } from "../../../shared/errors/ErrorCode";
import { BaseService } from "../../../shared/services/BaseService";
import { logger } from "../../../shared/logger/logger";

import ProctoringService from "../../proctoring/services/ProctoringService";
import { ProctoringSessionDocument } from "../../proctoring/types/proctoring.types";

import { McqAttemptRepository } from "../repositories/McqAttemptRepository";
import { McqTestRepository } from "../repositories/McqTestRepository";

import {
  McqAttemptDocument,
  McqAttemptStatus,
  McqSubmitReason,
  McqTestDocument,
  McqTestStatus,
} from "../types/mcq-test.types";

import { Requester, ensureCanManageTest } from "./testAccess";
import { normalizeAccessCode } from "./accessCode";
import { RandomSource, buildAttemptQuestions, scoreAttempt } from "./attemptScoring";

/**
 * Answers/submits are still accepted this long after the deadline, so
 * a save fired in the last second isn't lost to network latency.
 */
export const SUBMIT_GRACE_MS = 15_000;

const DUPLICATE_KEY_ERROR_CODE = 11000;

export interface TestPreview {
  test: McqTestDocument;
  myAttempt: McqAttemptDocument | null;
}

export interface AttemptWithProctoring {
  attempt: McqAttemptDocument;
  proctoring: ProctoringSessionDocument | null;
}

/**
 * Everything about attempts: the candidate taking a test, and the
 * author reviewing results. Time limits are enforced here, not trusted
 * to the client - see `settle`.
 */
export default class McqAttemptService extends BaseService<McqAttemptRepository> {
  constructor(
    repository: McqAttemptRepository,
    private readonly testRepository: McqTestRepository,
    private readonly proctoringService: ProctoringService,
    private readonly random: RandomSource = Math.random
  ) {
    super(repository);
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Helpers                              */
  /* -------------------------------------------------------------------------- */

  private ensureValidObjectId(id: string, label: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(400, `Invalid ${label}.`, ErrorCode.BAD_REQUEST);
    }
  }

  private isPastDeadline(attempt: McqAttemptDocument, now = Date.now()): boolean {
    return now > attempt.deadlineAt.getTime() + SUBMIT_GRACE_MS;
  }

  private async findTestByCode(code: string): Promise<McqTestDocument> {
    const test = await this.testRepository.findByAccessCode(
      normalizeAccessCode(code)
    );

    if (!test) {
      throw new ApiError(
        404,
        "No test matches that code. Check it and try again.",
        ErrorCode.NOT_FOUND
      );
    }

    return test;
  }

  /** candidateId may or may not be populated, depending on the query. */
  private candidateIdOf(attempt: McqAttemptDocument): string {
    const raw = attempt.candidateId as unknown;

    return raw && typeof raw === "object" && "_id" in (raw as Record<string, unknown>)
      ? String((raw as { _id: unknown })._id)
      : String(raw);
  }

  private async ensureOwnAttempt(
    attemptId: string,
    candidateId: string
  ): Promise<McqAttemptDocument> {
    this.ensureValidObjectId(attemptId, "attempt id");

    const attempt = await this.repository.findById(attemptId);

    if (!attempt) {
      throw new ApiError(404, "Attempt not found.", ErrorCode.NOT_FOUND);
    }

    if (this.candidateIdOf(attempt) !== candidateId) {
      throw new ApiError(
        403,
        "You can only access your own test attempts.",
        ErrorCode.FORBIDDEN
      );
    }

    return attempt;
  }

  private async ensureManageableTest(
    testId: string,
    requester: Requester
  ): Promise<McqTestDocument> {
    this.ensureValidObjectId(testId, "test id");

    const test = await this.testRepository.findById(testId);

    if (!test) {
      throw new ApiError(404, "Test not found.", ErrorCode.NOT_FOUND);
    }

    ensureCanManageTest(test, requester);

    return test;
  }

  /**
   * Submits and scores an attempt. Two phases (see the repository):
   * the status flip makes the answers final, then the score is stored.
   * If another request got there first, returns what it wrote.
   */
  private async finalize(
    attempt: McqAttemptDocument,
    reason: McqSubmitReason
  ): Promise<McqAttemptDocument> {
    const submitted = await this.repository.markSubmitted(
      attempt._id,
      reason,
      new Date()
    );

    if (!submitted) {
      const current = await this.repository.findById(attempt.id);
      return current ? this.settle(current) : attempt;
    }

    const scored = await this.repository.setResult(
      submitted._id,
      scoreAttempt(submitted.questions, submitted.answers, submitted.passPercentage)
    );

    await this.closeProctoring(attempt.id);

    return scored ?? submitted;
  }

  /** Best-effort - a proctoring hiccup must never fail a submission. */
  private async closeProctoring(attemptId: string): Promise<void> {
    try {
      await this.proctoringService.completeSessionForSubject(attemptId);
    } catch (error) {
      logger.warn(
        `Closing proctoring for MCQ attempt ${attemptId} failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private needsSettling(attempt: McqAttemptDocument): boolean {
    return attempt.status === McqAttemptStatus.IN_PROGRESS
      ? this.isPastDeadline(attempt)
      : !attempt.result;
  }

  /**
   * Lazy self-healing, run on every read: an attempt whose time ran
   * out is submitted as TIME_UP the moment anyone looks at it (no
   * background job needed), and a submission interrupted between its
   * two phases gets its score filled in.
   *
   * The returned document is unpopulated whenever it had to be
   * rewritten - re-read afterwards where populated fields matter.
   */
  private async settle(attempt: McqAttemptDocument): Promise<McqAttemptDocument> {
    if (!this.needsSettling(attempt)) {
      return attempt;
    }

    if (attempt.status === McqAttemptStatus.IN_PROGRESS) {
      return this.finalize(attempt, McqSubmitReason.TIME_UP);
    }

    const scored = await this.repository.setResult(
      attempt._id,
      scoreAttempt(attempt.questions, attempt.answers, attempt.passPercentage)
    );

    return scored ?? attempt;
  }

  /* -------------------------------------------------------------------------- */
  /*                                 Candidate                                   */
  /* -------------------------------------------------------------------------- */

  /** What a candidate sees before starting: the test's details and their own attempt, if any. */
  public async previewByCode(code: string, candidateId: string): Promise<TestPreview> {
    const test = await this.findTestByCode(code);

    const existing = await this.repository.findByTestAndCandidate(
      test._id,
      candidateId
    );

    return { test, myAttempt: existing ? await this.settle(existing) : null };
  }

  /**
   * Starts the candidate's attempt - or returns the one they already
   * have (each candidate gets one attempt per test; a refresh resumes
   * it, with the clock still running).
   */
  public async startAttempt(code: string, candidateId: string): Promise<McqAttemptDocument> {
    const test = await this.findTestByCode(code);

    const existing = await this.repository.findByTestAndCandidate(
      test._id,
      candidateId
    );

    if (existing) {
      return this.settle(existing);
    }

    if (test.status !== McqTestStatus.PUBLISHED) {
      throw new ApiError(
        409,
        "This test isn't accepting attempts right now.",
        ErrorCode.CONFLICT
      );
    }

    const startedAt = new Date();

    try {
      return await this.repository.create({
        testId: test._id,
        candidateId: new Types.ObjectId(candidateId),
        organizationId: test.organizationId,
        status: McqAttemptStatus.IN_PROGRESS,
        startedAt,
        deadlineAt: new Date(startedAt.getTime() + test.durationMinutes * 60_000),
        testTitle: test.title,
        passPercentage: test.passPercentage,
        showScoreToCandidate: test.showScoreToCandidate,
        questions: buildAttemptQuestions(test, this.random),
      });
    } catch (error) {
      // Double-click / two tabs: the unique (testId, candidateId) index
      // let only one create through - hand back that one.
      if ((error as { code?: number })?.code === DUPLICATE_KEY_ERROR_CODE) {
        const winner = await this.repository.findByTestAndCandidate(
          test._id,
          candidateId
        );

        if (winner) {
          return winner;
        }
      }

      throw error;
    }
  }

  public async getMyAttempt(attemptId: string, candidateId: string): Promise<McqAttemptDocument> {
    return this.settle(await this.ensureOwnAttempt(attemptId, candidateId));
  }

  public async listMyAttempts(candidateId: string): Promise<McqAttemptDocument[]> {
    const attempts = await this.repository.findByCandidate(candidateId);
    return Promise.all(attempts.map((attempt) => this.settle(attempt)));
  }

  public async saveAnswer(
    attemptId: string,
    candidateId: string,
    questionId: string,
    selectedOptionIndex: number | null
  ): Promise<void> {
    const attempt = await this.settle(
      await this.ensureOwnAttempt(attemptId, candidateId)
    );

    if (attempt.status !== McqAttemptStatus.IN_PROGRESS) {
      throw new ApiError(
        409,
        "This attempt has already been submitted.",
        ErrorCode.CONFLICT
      );
    }

    const question = attempt.questions.find(
      (candidate) => candidate.questionId.toString() === questionId
    );

    if (!question) {
      throw new ApiError(400, "That question isn't part of this attempt.", ErrorCode.BAD_REQUEST);
    }

    if (selectedOptionIndex !== null && selectedOptionIndex >= question.options.length) {
      throw new ApiError(400, "That option doesn't exist.", ErrorCode.BAD_REQUEST);
    }

    const written = await this.repository.setAnswer(
      attempt._id,
      questionId,
      selectedOptionIndex,
      new Date(Date.now() - SUBMIT_GRACE_MS)
    );

    if (!written) {
      // Submitted or timed out between the read above and this write.
      throw new ApiError(
        409,
        "Time is up - this attempt has been submitted.",
        ErrorCode.CONFLICT
      );
    }
  }

  /** Idempotent - submitting an already-submitted attempt returns it unchanged. */
  public async submitAttempt(
    attemptId: string,
    candidateId: string,
    reason: McqSubmitReason
  ): Promise<McqAttemptDocument> {
    const attempt = await this.settle(
      await this.ensureOwnAttempt(attemptId, candidateId)
    );

    if (attempt.status === McqAttemptStatus.SUBMITTED) {
      return attempt;
    }

    return this.finalize(attempt, reason);
  }

  /* -------------------------------------------------------------------------- */
  /*                                   Author                                    */
  /* -------------------------------------------------------------------------- */

  public async listAttemptsForTest(
    testId: string,
    requester: Requester
  ): Promise<{ test: McqTestDocument; attempts: AttemptWithProctoring[] }> {
    const test = await this.ensureManageableTest(testId, requester);

    let attempts = await this.repository.findByTest(test._id);

    if (attempts.some((attempt) => this.needsSettling(attempt))) {
      await Promise.all(attempts.map((attempt) => this.settle(attempt)));
      // Re-read so settled rows keep their populated candidate.
      attempts = await this.repository.findByTest(test._id);
    }

    const sessions = await this.proctoringService.findSessionsForSubjects(
      attempts.map((attempt) => attempt.id)
    );

    const sessionBySubject = new Map(
      sessions.map((session) => [session.subjectId.toString(), session])
    );

    return {
      test,
      attempts: attempts.map((attempt) => ({
        attempt,
        proctoring: sessionBySubject.get(attempt.id) ?? null,
      })),
    };
  }

  public async getAttemptForReview(
    testId: string,
    attemptId: string,
    requester: Requester
  ): Promise<{ test: McqTestDocument; attempt: McqAttemptDocument }> {
    const test = await this.ensureManageableTest(testId, requester);
    this.ensureValidObjectId(attemptId, "attempt id");

    const attempt = await this.repository.findById(attemptId);

    if (!attempt || attempt.testId.toString() !== test.id) {
      throw new ApiError(404, "Attempt not found.", ErrorCode.NOT_FOUND);
    }

    await this.settle(attempt);

    const withCandidate = await this.repository.findByIdWithCandidate(attemptId);

    return { test, attempt: withCandidate ?? attempt };
  }
}
