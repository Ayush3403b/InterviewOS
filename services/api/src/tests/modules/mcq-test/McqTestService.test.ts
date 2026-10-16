import { describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";

// pdf-parse 1.x runs its own debug harness when imported outside a
// CommonJS parent (as under vitest) - same reason ResumeService.test
// mocks the extractor.
vi.mock("pdf-parse", () => ({ default: vi.fn() }));

import McqTestService from "../../../modules/mcq-test/services/McqTestService";
import {
  MCQ_LIMITS,
  McqDifficulty,
  McqQuestionSource,
  McqTestStatus,
} from "../../../modules/mcq-test/types/mcq-test.types";
import { UserRole } from "../../../modules/users/types/user.types";

const AUTHOR_ID = new Types.ObjectId().toString();
const AUTHOR = { userId: AUTHOR_ID, role: UserRole.RECRUITER };

function makeQuestion() {
  return {
    _id: new Types.ObjectId(),
    text: "Existing question?",
    options: ["a", "b"],
    correctOptionIndex: 0,
    difficulty: McqDifficulty.MEDIUM,
    points: 1,
    source: McqQuestionSource.AI_TOPICS,
  };
}

function makeTest(overrides: Record<string, unknown> = {}) {
  const id = new Types.ObjectId();
  return {
    _id: id,
    id: id.toString(),
    title: "Test",
    createdBy: { toString: () => AUTHOR_ID },
    status: McqTestStatus.DRAFT,
    questions: [makeQuestion()],
    accessCode: undefined as string | undefined,
    ...overrides,
  };
}

function makeService(test: ReturnType<typeof makeTest>, attemptCount = 0) {
  const repository = {
    findById: vi.fn().mockResolvedValue(test),
    create: vi.fn().mockImplementation(async (data) => data),
    updateDraft: vi.fn().mockResolvedValue(test),
    replaceQuestions: vi.fn().mockResolvedValue(test),
    appendQuestions: vi.fn().mockResolvedValue(test),
    transition: vi.fn().mockImplementation(async (_id, _from, to, extra = {}) => ({
      ...test,
      status: to,
      ...extra,
    })),
    accessCodeExists: vi.fn().mockResolvedValue(false),
    delete: vi.fn().mockResolvedValue(test),
  };

  const attemptRepository = {
    countByTests: vi.fn().mockResolvedValue(new Map()),
    countByTest: vi.fn().mockResolvedValue(attemptCount),
  };

  const userRepository = {
    findById: vi.fn().mockResolvedValue({ organizationId: new Types.ObjectId() }),
  };

  const mcqAgent = {
    generateFromTopics: vi.fn().mockImplementation(async ({ count }) =>
      Array.from({ length: count }, (_, i) => ({
        question: `Generated ${i}?`,
        options: ["x", "y", "z", "w"],
        correctOptionIndex: 2,
        explanation: "",
        topic: "T",
        difficulty: "HARD",
      }))
    ),
    generateFromMaterial: vi.fn().mockResolvedValue({ mode: "GENERATED", questions: [] }),
  };

  const service = new McqTestService(
    repository as never,
    attemptRepository as never,
    userRepository as never,
    mcqAgent as never
  );

  return { service, repository, attemptRepository, mcqAgent };
}

describe("McqTestService ownership", () => {

  it("stops another recruiter from editing someone else's test", async () => {

    const test = makeTest();
    const { service } = makeService(test);

    await expect(
      service.updateTest(test.id, { title: "Hijacked" }, {
        userId: new Types.ObjectId().toString(),
        role: UserRole.RECRUITER,
      })
    ).rejects.toMatchObject({ statusCode: 403 });

  });

  it("stamps the author's organization on a new test", async () => {

    const { service, repository } = makeService(makeTest());

    await service.createTest({ title: "New test", durationMinutes: 20 }, AUTHOR_ID);

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: McqTestStatus.DRAFT,
        organizationId: expect.any(Types.ObjectId),
      })
    );

  });

});

describe("McqTestService draft lock", () => {

  it("refuses question edits on a published test", async () => {

    const test = makeTest({ status: McqTestStatus.PUBLISHED });
    const { service, repository } = makeService(test);

    await expect(service.replaceQuestions(test.id, [], AUTHOR)).rejects.toMatchObject({
      statusCode: 409,
    });
    expect(repository.replaceQuestions).not.toHaveBeenCalled();

  });

  it("keeps an edited AI question labelled as AI-sourced", async () => {

    const test = makeTest();
    const { service, repository } = makeService(test);
    const existing = test.questions[0];

    await service.replaceQuestions(
      test.id,
      [
        { id: existing._id.toString(), text: "Edited?", options: ["a", "b"], correctOptionIndex: 1 },
        { text: "Brand new?", options: ["c", "d"], correctOptionIndex: 0 },
      ],
      AUTHOR
    );

    const saved = repository.replaceQuestions.mock.calls[0][1];
    expect(saved[0]).toMatchObject({ _id: existing._id, source: McqQuestionSource.AI_TOPICS });
    expect(saved[1]).toMatchObject({ source: McqQuestionSource.MANUAL, points: 1 });

  });

});

describe("McqTestService AI generation", () => {

  it("appends generated questions, tagged with their source, and avoids repeats", async () => {

    const test = makeTest();
    const { service, repository, mcqAgent } = makeService(test);

    const outcome = await service.generateFromTopics(
      test.id,
      { topics: "JS", count: 3, difficulty: "MIXED" },
      AUTHOR
    );

    expect(outcome.addedCount).toBe(3);
    expect(mcqAgent.generateFromTopics).toHaveBeenCalledWith(
      expect.objectContaining({ existingQuestions: ["Existing question?"] })
    );
    const appended = repository.appendQuestions.mock.calls[0][1];
    expect(appended).toHaveLength(3);
    expect(appended[0]).toMatchObject({ source: McqQuestionSource.AI_TOPICS, correctOptionIndex: 2 });

  });

  it("never asks for more questions than the test has room for", async () => {

    const test = makeTest({
      questions: Array.from({ length: MCQ_LIMITS.maxQuestionsPerTest - 2 }, makeQuestion),
    });
    const { service, mcqAgent } = makeService(test);

    await service.generateFromTopics(test.id, { topics: "JS", count: 10, difficulty: "EASY" }, AUTHOR);

    expect(mcqAgent.generateFromTopics).toHaveBeenCalledWith(expect.objectContaining({ count: 2 }));

  });

  it("422s when uploaded material yields no questions", async () => {

    const test = makeTest();
    const { service } = makeService(test);

    await expect(
      service.importFromMaterial(
        test.id,
        [{ buffer: Buffer.from("x"), mimetype: "image/png", originalname: "blank.png", size: 1 }],
        { count: 5, difficulty: "MIXED", mode: "AUTO" },
        AUTHOR
      )
    ).rejects.toMatchObject({ statusCode: 422 });

  });

});

describe("McqTestService lifecycle", () => {

  it("won't publish a test with no questions", async () => {

    const test = makeTest({ questions: [] });
    const { service } = makeService(test);

    await expect(service.publishTest(test.id, AUTHOR)).rejects.toMatchObject({ statusCode: 409 });

  });

  it("generates an access code on first publish and keeps it on republish", async () => {

    const fresh = makeTest();
    const first = makeService(fresh);

    const published = await first.service.publishTest(fresh.id, AUTHOR);
    expect(published.test.accessCode).toMatch(/^[A-Z2-9]{8}$/);

    const republish = makeTest({ accessCode: "KEEPCODE" });
    const second = makeService(republish);

    const again = await second.service.publishTest(republish.id, AUTHOR);
    expect(again.test.accessCode).toBe("KEEPCODE");

  });

  it("won't revert to draft or delete once candidates have attempts", async () => {

    const test = makeTest({ status: McqTestStatus.PUBLISHED });
    const { service, repository } = makeService(test, 1);

    await expect(service.revertToDraft(test.id, AUTHOR)).rejects.toMatchObject({ statusCode: 409 });
    await expect(service.deleteTest(test.id, AUTHOR)).rejects.toMatchObject({ statusCode: 409 });
    expect(repository.delete).not.toHaveBeenCalled();

  });

});
