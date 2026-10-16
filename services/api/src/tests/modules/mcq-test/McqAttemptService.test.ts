import { describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";

import McqAttemptService, {
  SUBMIT_GRACE_MS,
} from "../../../modules/mcq-test/services/McqAttemptService";
import { McqTestResponse } from "../../../modules/mcq-test/responses/McqTestResponse";
import {
  McqAttemptStatus,
  McqDifficulty,
  McqQuestionSource,
  McqSubmitReason,
  McqTestStatus,
} from "../../../modules/mcq-test/types/mcq-test.types";
import { UserRole } from "../../../modules/users/types/user.types";

const CANDIDATE_ID = new Types.ObjectId().toString();
const AUTHOR_ID = new Types.ObjectId().toString();
const QUESTION_ID = new Types.ObjectId();

function makeTest(overrides: Record<string, unknown> = {}) {
  const id = new Types.ObjectId();
  return {
    _id: id,
    id: id.toString(),
    title: "JS Basics",
    createdBy: { toString: () => AUTHOR_ID },
    status: McqTestStatus.PUBLISHED,
    durationMinutes: 30,
    passPercentage: 50,
    showScoreToCandidate: true,
    shuffleQuestions: false,
    shuffleOptions: false,
    questions: [
      {
        _id: QUESTION_ID,
        text: "2 + 2?",
        options: ["3", "4", "5", "6"],
        correctOptionIndex: 1,
        difficulty: McqDifficulty.EASY,
        points: 1,
        source: McqQuestionSource.MANUAL,
      },
    ],
    ...overrides,
  };
}

function makeAttempt(overrides: Record<string, unknown> = {}) {
  const id = new Types.ObjectId();
  return {
    _id: id,
    id: id.toString(),
    testId: new Types.ObjectId(),
    candidateId: { toString: () => CANDIDATE_ID },
    testTitle: "JS Basics",
    status: McqAttemptStatus.IN_PROGRESS,
    startedAt: new Date(),
    deadlineAt: new Date(Date.now() + 10 * 60_000),
    passPercentage: 50,
    showScoreToCandidate: true,
    questions: [
      {
        questionId: QUESTION_ID,
        text: "2 + 2?",
        options: ["3", "4", "5", "6"],
        correctOptionIndex: 1,
        optionOrder: [2, 0, 3, 1],
        points: 1,
        explanation: "Basic arithmetic.",
      },
    ],
    answers: new Map<string, number>(),
    result: undefined as unknown,
    ...overrides,
  };
}

function makeService(options: {
  test?: ReturnType<typeof makeTest> | null;
  attempt?: ReturnType<typeof makeAttempt> | null;
  existingForCandidate?: ReturnType<typeof makeAttempt> | null;
} = {}) {
  const attempt = options.attempt ?? null;

  const repository = {
    findById: vi.fn().mockResolvedValue(attempt),
    findByTestAndCandidate: vi.fn().mockResolvedValue(options.existingForCandidate ?? null),
    create: vi.fn().mockImplementation(async (data) => ({ ...data, _id: new Types.ObjectId() })),
    setAnswer: vi.fn().mockResolvedValue(true),
    markSubmitted: vi.fn().mockImplementation(async () =>
      attempt ? { ...attempt, status: McqAttemptStatus.SUBMITTED } : null
    ),
    setResult: vi.fn().mockImplementation(async (_id, result) => ({
      ...attempt,
      status: McqAttemptStatus.SUBMITTED,
      result,
    })),
    findByCandidate: vi.fn().mockResolvedValue(attempt ? [attempt] : []),
    findByTest: vi.fn().mockResolvedValue(attempt ? [attempt] : []),
    findByIdWithCandidate: vi.fn().mockResolvedValue(attempt),
  };

  const testRepository = {
    findByAccessCode: vi.fn().mockResolvedValue(options.test === undefined ? makeTest() : options.test),
    findById: vi.fn().mockResolvedValue(options.test === undefined ? makeTest() : options.test),
  };

  const proctoringService = {
    completeSessionForSubject: vi.fn().mockResolvedValue(null),
    findSessionsForSubjects: vi.fn().mockResolvedValue([]),
  };

  const service = new McqAttemptService(
    repository as never,
    testRepository as never,
    proctoringService as never,
    () => 0.5
  );

  return { service, repository, testRepository, proctoringService };
}

describe("McqAttemptService.startAttempt", () => {

  it("creates an attempt with a question snapshot and a deadline from the test's duration", async () => {

    const { service, repository } = makeService();

    const before = Date.now();
    await service.startAttempt("ab-cd 1234", CANDIDATE_ID);

    const created = repository.create.mock.calls[0][0];
    expect(created.status).toBe(McqAttemptStatus.IN_PROGRESS);
    expect(created.testTitle).toBe("JS Basics");
    expect(created.questions).toHaveLength(1);
    expect(created.deadlineAt.getTime() - created.startedAt.getTime()).toBe(30 * 60_000);
    expect(created.startedAt.getTime()).toBeGreaterThanOrEqual(before);

  });

  it("normalises the access code before looking it up", async () => {

    const { service, testRepository } = makeService();

    await service.startAttempt(" ab-cd 1234 ", CANDIDATE_ID);

    expect(testRepository.findByAccessCode).toHaveBeenCalledWith("ABCD1234");

  });

  it("resumes the candidate's existing attempt instead of creating a second one", async () => {

    const existing = makeAttempt();
    const { service, repository } = makeService({ existingForCandidate: existing });

    const result = await service.startAttempt("CODE", CANDIDATE_ID);

    expect(result).toBe(existing);
    expect(repository.create).not.toHaveBeenCalled();

  });

  it("refuses new attempts on a closed test", async () => {

    const { service } = makeService({ test: makeTest({ status: McqTestStatus.CLOSED }) });

    await expect(service.startAttempt("CODE", CANDIDATE_ID)).rejects.toMatchObject({
      statusCode: 409,
    });

  });

  it("404s on an unknown code", async () => {

    const { service } = makeService({ test: null });

    await expect(service.startAttempt("NOPE", CANDIDATE_ID)).rejects.toMatchObject({
      statusCode: 404,
    });

  });

  it("returns the winning attempt when a double-click races two creates", async () => {

    const winner = makeAttempt();
    const { service, repository } = makeService();
    repository.findByTestAndCandidate
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(winner);
    repository.create.mockRejectedValueOnce(Object.assign(new Error("dup"), { code: 11000 }));

    const result = await service.startAttempt("CODE", CANDIDATE_ID);

    expect(result).toBe(winner);

  });

});

describe("McqAttemptService.saveAnswer", () => {

  it("saves an answer for an in-progress attempt", async () => {

    const attempt = makeAttempt();
    const { service, repository } = makeService({ attempt });

    await service.saveAnswer(attempt.id, CANDIDATE_ID, QUESTION_ID.toString(), 1);

    expect(repository.setAnswer).toHaveBeenCalledWith(
      attempt._id,
      QUESTION_ID.toString(),
      1,
      expect.any(Date)
    );

  });

  it("forbids saving into someone else's attempt", async () => {

    const attempt = makeAttempt();
    const { service } = makeService({ attempt });

    await expect(
      service.saveAnswer(attempt.id, new Types.ObjectId().toString(), QUESTION_ID.toString(), 1)
    ).rejects.toMatchObject({ statusCode: 403 });

  });

  it("rejects a question that isn't in the attempt, and an option out of range", async () => {

    const attempt = makeAttempt();
    const { service } = makeService({ attempt });

    await expect(
      service.saveAnswer(attempt.id, CANDIDATE_ID, new Types.ObjectId().toString(), 0)
    ).rejects.toMatchObject({ statusCode: 400 });

    await expect(
      service.saveAnswer(attempt.id, CANDIDATE_ID, QUESTION_ID.toString(), 4)
    ).rejects.toMatchObject({ statusCode: 400 });

  });

  it("auto-submits a timed-out attempt instead of saving, then reports 409", async () => {

    const attempt = makeAttempt({
      deadlineAt: new Date(Date.now() - SUBMIT_GRACE_MS - 1000),
    });
    const { service, repository, proctoringService } = makeService({ attempt });

    await expect(
      service.saveAnswer(attempt.id, CANDIDATE_ID, QUESTION_ID.toString(), 1)
    ).rejects.toMatchObject({ statusCode: 409 });

    expect(repository.markSubmitted).toHaveBeenCalledWith(
      attempt._id,
      McqSubmitReason.TIME_UP,
      expect.any(Date)
    );
    expect(repository.setAnswer).not.toHaveBeenCalled();
    expect(proctoringService.completeSessionForSubject).toHaveBeenCalledWith(attempt.id);

  });

  it("still accepts a save inside the grace period after the deadline", async () => {

    const attempt = makeAttempt({ deadlineAt: new Date(Date.now() - 2000) });
    const { service, repository } = makeService({ attempt });

    await service.saveAnswer(attempt.id, CANDIDATE_ID, QUESTION_ID.toString(), null);

    expect(repository.setAnswer).toHaveBeenCalled();

  });

});

describe("McqAttemptService.submitAttempt", () => {

  it("scores the attempt and closes its proctoring session", async () => {

    const attempt = makeAttempt({
      answers: new Map([[QUESTION_ID.toString(), 1]]),
    });
    const { service, repository, proctoringService } = makeService({ attempt });

    const result = await service.submitAttempt(attempt.id, CANDIDATE_ID, McqSubmitReason.MANUAL);

    expect(repository.markSubmitted).toHaveBeenCalledWith(
      attempt._id,
      McqSubmitReason.MANUAL,
      expect.any(Date)
    );
    expect(result.result).toMatchObject({ score: 1, maxScore: 1, percentage: 100, passed: true });
    expect(proctoringService.completeSessionForSubject).toHaveBeenCalledWith(attempt.id);

  });

  it("is idempotent for an already-submitted attempt", async () => {

    const attempt = makeAttempt({
      status: McqAttemptStatus.SUBMITTED,
      result: { score: 0, maxScore: 1, percentage: 0, passed: false, correctCount: 0, answeredCount: 0 },
    });
    const { service, repository } = makeService({ attempt });

    const result = await service.submitAttempt(attempt.id, CANDIDATE_ID, McqSubmitReason.MANUAL);

    expect(result).toBe(attempt);
    expect(repository.markSubmitted).not.toHaveBeenCalled();

  });

  it("still submits when closing proctoring fails", async () => {

    const attempt = makeAttempt();
    const { service, proctoringService } = makeService({ attempt });
    proctoringService.completeSessionForSubject.mockRejectedValueOnce(new Error("db"));

    const result = await service.submitAttempt(attempt.id, CANDIDATE_ID, McqSubmitReason.PROCTORING);

    expect(result.status).toBe(McqAttemptStatus.SUBMITTED);

  });

});

describe("McqAttemptService results (author side)", () => {

  it("only lets the test's author (or an admin) list its results", async () => {

    const { service } = makeService({ attempt: makeAttempt() });
    const test = makeTest();

    await expect(
      service.listAttemptsForTest(test.id, {
        userId: new Types.ObjectId().toString(),
        role: UserRole.RECRUITER,
      })
    ).rejects.toMatchObject({ statusCode: 403 });

    await expect(
      service.listAttemptsForTest(test.id, {
        userId: new Types.ObjectId().toString(),
        role: UserRole.ADMIN,
      })
    ).resolves.toBeDefined();

  });

  it("joins each attempt with its proctoring session", async () => {

    const attempt = makeAttempt();
    const { service, proctoringService } = makeService({ attempt });
    proctoringService.findSessionsForSubjects.mockResolvedValueOnce([
      { subjectId: attempt._id, riskScore: 80, trustScore: 40, status: "FLAGGED" },
    ]);

    const { attempts } = await service.listAttemptsForTest(makeTest().id, {
      userId: AUTHOR_ID,
      role: UserRole.RECRUITER,
    });

    expect(attempts[0].proctoring).toMatchObject({ status: "FLAGGED" });

  });

});

describe("McqTestResponse candidate views", () => {

  it("never exposes the answer key or explanations while the attempt is in progress", () => {

    const view = McqTestResponse.toCandidateAttempt(makeAttempt() as never);
    const json = JSON.stringify(view);

    expect(json).not.toContain("correctOptionIndex");
    expect(json).not.toContain("Basic arithmetic.");
    // Options arrive in the candidate's shuffled order, tagged with their real index.
    expect(view.questions[0].options.map((option) => option.index)).toEqual([2, 0, 3, 1]);

  });

  it("hides the score when the author chose not to show it", () => {

    const view = McqTestResponse.toCandidateAttempt(
      makeAttempt({
        status: McqAttemptStatus.SUBMITTED,
        showScoreToCandidate: false,
        result: { score: 1, maxScore: 1, percentage: 100, passed: true, correctCount: 1, answeredCount: 1 },
      }) as never
    );

    expect(view.result).toBeNull();
    expect(view.questions).toEqual([]);

  });

});
