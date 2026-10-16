import { Types } from "mongoose";

import { ApiError } from "../../../shared/errors/ApiError";
import { ErrorCode } from "../../../shared/errors/ErrorCode";
import { BaseService } from "../../../shared/services/BaseService";

import { UserRepository } from "../../users/repositories/UserRepository";

import { GeneratedMcq, IMcqAgent } from "../../../agents/mcq/IMcqAgent";

import { McqTestRepository, NewMcqQuestion } from "../repositories/McqTestRepository";
import { AttemptCounts, McqAttemptRepository } from "../repositories/McqAttemptRepository";

import {
  CreateMcqTestDto,
  GenerateFromTopicsDto,
  ImportFromMaterialDto,
  McqQuestionInputDto,
  UpdateMcqTestDto,
} from "../dtos/McqTest.dto";

import {
  MCQ_LIMITS,
  McqDifficulty,
  McqQuestionSource,
  McqTestDocument,
  McqTestStatus,
} from "../types/mcq-test.types";

import { Requester, ensureCanManageTest } from "./testAccess";
import { generateAccessCode } from "./accessCode";
import { UploadedMaterialFile, prepareStudyMaterial } from "./prepareStudyMaterial";

/** Collisions are ~1 in 10^12 per try; this is just a backstop. */
const ACCESS_CODE_ATTEMPTS = 5;

export interface TestWithCounts {
  test: McqTestDocument;
  counts: AttemptCounts;
}

export interface GenerationOutcome extends TestWithCounts {
  addedCount: number;
  /** Only for uploads: whether the AI copied existing questions or wrote new ones. */
  mode?: "EXTRACTED" | "GENERATED";
  /** Only for uploads: whether the extracted PDF text had to be cut short. */
  truncated?: boolean;
}

const NO_ATTEMPTS: AttemptCounts = { total: 0, submitted: 0 };

/**
 * The test author's side: building, generating, publishing. Taking a
 * test and reviewing results live in McqAttemptService.
 */
export default class McqTestService extends BaseService<McqTestRepository> {
  constructor(
    repository: McqTestRepository,
    private readonly attemptRepository: McqAttemptRepository,
    private readonly userRepository: UserRepository,
    private readonly mcqAgent: IMcqAgent
  ) {
    super(repository);
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Helpers                              */
  /* -------------------------------------------------------------------------- */

  private async ensureManageableTest(
    id: string,
    requester: Requester
  ): Promise<McqTestDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(400, "Invalid test id.", ErrorCode.BAD_REQUEST);
    }

    const test = await this.repository.findById(id);

    if (!test) {
      throw new ApiError(404, "Test not found.", ErrorCode.NOT_FOUND);
    }

    ensureCanManageTest(test, requester);

    return test;
  }

  private ensureDraft(test: McqTestDocument): void {
    if (test.status !== McqTestStatus.DRAFT) {
      throw new ApiError(
        409,
        "Published tests are locked. Revert it to a draft (only possible before anyone has started it) to make changes.",
        ErrorCode.CONFLICT
      );
    }
  }

  /** The repository's draft-only writes return null if the test was published meanwhile. */
  private ensureWritten(test: McqTestDocument | null): McqTestDocument {
    if (!test) {
      throw new ApiError(
        409,
        "This test was published while you were editing it.",
        ErrorCode.CONFLICT
      );
    }

    return test;
  }

  private remainingCapacity(test: McqTestDocument): number {
    const remaining = MCQ_LIMITS.maxQuestionsPerTest - test.questions.length;

    if (remaining <= 0) {
      throw new ApiError(
        409,
        `This test already has the maximum of ${MCQ_LIMITS.maxQuestionsPerTest} questions.`,
        ErrorCode.CONFLICT
      );
    }

    return remaining;
  }

  private async withCounts(test: McqTestDocument): Promise<TestWithCounts> {
    const counts = await this.attemptRepository.countByTests([test._id]);

    return { test, counts: counts.get(test._id.toString()) ?? NO_ATTEMPTS };
  }

  private toNewQuestions(
    generated: GeneratedMcq[],
    source: McqQuestionSource
  ): NewMcqQuestion[] {
    return generated.map((mcq) => ({
      text: mcq.question,
      options: mcq.options,
      correctOptionIndex: mcq.correctOptionIndex,
      explanation: mcq.explanation || undefined,
      topic: mcq.topic || undefined,
      difficulty: mcq.difficulty as McqDifficulty,
      points: 1,
      source,
    }));
  }

  private async uniqueAccessCode(): Promise<string> {
    for (let attempt = 0; attempt < ACCESS_CODE_ATTEMPTS; attempt++) {
      const code = generateAccessCode();

      if (!(await this.repository.accessCodeExists(code))) {
        return code;
      }
    }

    throw new ApiError(
      500,
      "Could not generate an access code. Please try again.",
      ErrorCode.INTERNAL_SERVER_ERROR
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                                    CRUD                                     */
  /* -------------------------------------------------------------------------- */

  public async createTest(
    data: CreateMcqTestDto,
    userId: string
  ): Promise<McqTestDocument> {
    const author = await this.userRepository.findById(userId);

    return this.repository.create({
      ...data,
      createdBy: new Types.ObjectId(userId),
      organizationId: author?.organizationId,
      status: McqTestStatus.DRAFT,
      questions: [],
    });
  }

  public async listMyTests(userId: string): Promise<TestWithCounts[]> {
    const tests = await this.repository.findByCreator(userId);

    const counts = await this.attemptRepository.countByTests(
      tests.map((test) => test._id)
    );

    return tests.map((test) => ({
      test,
      counts: counts.get(test._id.toString()) ?? NO_ATTEMPTS,
    }));
  }

  public async getTest(id: string, requester: Requester): Promise<TestWithCounts> {
    return this.withCounts(await this.ensureManageableTest(id, requester));
  }

  public async updateTest(
    id: string,
    data: UpdateMcqTestDto,
    requester: Requester
  ): Promise<TestWithCounts> {
    const test = await this.ensureManageableTest(id, requester);
    this.ensureDraft(test);

    return this.withCounts(
      this.ensureWritten(await this.repository.updateDraft(id, data))
    );
  }

  public async deleteTest(id: string, requester: Requester): Promise<void> {
    await this.ensureManageableTest(id, requester);

    if ((await this.attemptRepository.countByTest(id)) > 0) {
      throw new ApiError(
        409,
        "Candidates have already taken this test, so its results would be lost. Close it instead.",
        ErrorCode.CONFLICT
      );
    }

    await this.repository.delete(id);
  }

  /* -------------------------------------------------------------------------- */
  /*                                  Questions                                  */
  /* -------------------------------------------------------------------------- */

  /** The editor saves the whole question list at once. */
  public async replaceQuestions(
    id: string,
    questions: McqQuestionInputDto[],
    requester: Requester
  ): Promise<TestWithCounts> {
    const test = await this.ensureManageableTest(id, requester);
    this.ensureDraft(test);

    const sourceById = new Map(
      test.questions.map((question) => [question._id.toString(), question.source])
    );

    const replacement: NewMcqQuestion[] = questions.map((question) => {
      const keepsId = question.id && Types.ObjectId.isValid(question.id);

      return {
        ...(keepsId ? { _id: new Types.ObjectId(question.id) } : {}),
        text: question.text,
        options: question.options,
        correctOptionIndex: question.correctOptionIndex,
        explanation: question.explanation || undefined,
        topic: question.topic || undefined,
        difficulty: question.difficulty ?? McqDifficulty.MEDIUM,
        points: question.points ?? 1,
        // An AI question stays labelled as such after the author edits it.
        source:
          (question.id ? sourceById.get(question.id) : undefined) ??
          McqQuestionSource.MANUAL,
      };
    });

    return this.withCounts(
      this.ensureWritten(await this.repository.replaceQuestions(id, replacement))
    );
  }

  public async generateFromTopics(
    id: string,
    data: GenerateFromTopicsDto,
    requester: Requester
  ): Promise<GenerationOutcome> {
    const test = await this.ensureManageableTest(id, requester);
    this.ensureDraft(test);

    const count = Math.min(data.count, this.remainingCapacity(test));

    const generated = await this.mcqAgent.generateFromTopics({
      topics: data.topics,
      count,
      difficulty: data.difficulty,
      instructions: data.instructions,
      existingQuestions: test.questions.map((question) => question.text),
      userId: requester.userId,
    });

    const updated = this.ensureWritten(
      await this.repository.appendQuestions(
        id,
        this.toNewQuestions(generated, McqQuestionSource.AI_TOPICS)
      )
    );

    return { ...(await this.withCounts(updated)), addedCount: generated.length };
  }

  public async importFromMaterial(
    id: string,
    files: UploadedMaterialFile[],
    data: ImportFromMaterialDto,
    requester: Requester
  ): Promise<GenerationOutcome> {
    const test = await this.ensureManageableTest(id, requester);
    this.ensureDraft(test);

    const count = Math.min(data.count, this.remainingCapacity(test));
    const material = await prepareStudyMaterial(files);

    const result = await this.mcqAgent.generateFromMaterial({
      mode: data.mode,
      count,
      difficulty: data.difficulty,
      instructions: data.instructions,
      text: material.text || undefined,
      attachments: material.attachments,
      existingQuestions: test.questions.map((question) => question.text),
      userId: requester.userId,
    });

    if (!result.questions.length) {
      throw new ApiError(
        422,
        "Couldn't find any usable questions or study content in those files. Check they're readable, or try clearer photos.",
        ErrorCode.BAD_REQUEST
      );
    }

    const updated = this.ensureWritten(
      await this.repository.appendQuestions(
        id,
        this.toNewQuestions(result.questions, McqQuestionSource.AI_MATERIAL)
      )
    );

    return {
      ...(await this.withCounts(updated)),
      addedCount: result.questions.length,
      mode: result.mode,
      truncated: material.truncated,
    };
  }

  /* -------------------------------------------------------------------------- */
  /*                                  Lifecycle                                  */
  /* -------------------------------------------------------------------------- */

  public async publishTest(id: string, requester: Requester): Promise<TestWithCounts> {
    const test = await this.ensureManageableTest(id, requester);
    this.ensureDraft(test);

    if (!test.questions.length) {
      throw new ApiError(
        409,
        "Add at least one question before publishing.",
        ErrorCode.CONFLICT
      );
    }

    const published = this.ensureWritten(
      await this.repository.transition(id, [McqTestStatus.DRAFT], McqTestStatus.PUBLISHED, {
        // A test reverted to draft and republished keeps its code, so
        // links already shared keep working.
        accessCode: test.accessCode ?? (await this.uniqueAccessCode()),
        publishedAt: new Date(),
      })
    );

    return this.withCounts(published);
  }

  public async closeTest(id: string, requester: Requester): Promise<TestWithCounts> {
    await this.ensureManageableTest(id, requester);

    const closed = await this.repository.transition(
      id,
      [McqTestStatus.PUBLISHED],
      McqTestStatus.CLOSED,
      { closedAt: new Date() }
    );

    if (!closed) {
      throw new ApiError(409, "Only a published test can be closed.", ErrorCode.CONFLICT);
    }

    return this.withCounts(closed);
  }

  public async reopenTest(id: string, requester: Requester): Promise<TestWithCounts> {
    await this.ensureManageableTest(id, requester);

    const reopened = await this.repository.transition(
      id,
      [McqTestStatus.CLOSED],
      McqTestStatus.PUBLISHED
    );

    if (!reopened) {
      throw new ApiError(409, "Only a closed test can be reopened.", ErrorCode.CONFLICT);
    }

    return this.withCounts(reopened);
  }

  /**
   * Unlocks a published test for editing - only while nobody has
   * started it, since attempts are scored against the questions they
   * were given.
   */
  public async revertToDraft(id: string, requester: Requester): Promise<TestWithCounts> {
    const test = await this.ensureManageableTest(id, requester);

    if (test.status === McqTestStatus.DRAFT) {
      return this.withCounts(test);
    }

    if ((await this.attemptRepository.countByTest(id)) > 0) {
      throw new ApiError(
        409,
        "Candidates have already started this test, so its questions can't change. Create a new test instead.",
        ErrorCode.CONFLICT
      );
    }

    const draft = await this.repository.transition(
      id,
      [McqTestStatus.PUBLISHED, McqTestStatus.CLOSED],
      McqTestStatus.DRAFT
    );

    return this.withCounts(draft ?? test);
  }
}
