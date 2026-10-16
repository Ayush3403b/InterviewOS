import { describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";

import ProctoringService from "../../../modules/proctoring/services/ProctoringService";
import {
  ProctoredSubjectType,
  ProctoringEventStatus,
  ProctoringSessionStatus,
} from "../../../modules/proctoring/types/proctoring.types";
import { UserRole } from "../../../modules/users/types/user.types";

const CANDIDATE_ID = new Types.ObjectId().toString();
const OTHER_USER_ID = new Types.ObjectId().toString();
const SUBJECT_ID = new Types.ObjectId().toString();
const ORG_ID = new Types.ObjectId().toString();

function makeSession(overrides: Record<string, unknown> = {}) {
  return {
    _id: new Types.ObjectId(),
    subjectType: ProctoredSubjectType.MCQ_ATTEMPT,
    subjectId: new Types.ObjectId(SUBJECT_ID),
    candidateId: { _id: CANDIDATE_ID, firstName: "Ada", lastName: "L" },
    status: ProctoringSessionStatus.ACTIVE,
    trustScore: 100,
    riskScore: 0,
    referenceFrame: undefined as string | undefined,
    ...overrides,
  };
}

function makeService(existing: ReturnType<typeof makeSession> | null = null) {
  const repository = {
    findBySubject: vi.fn().mockResolvedValue(existing),
    createForSubject: vi.fn().mockImplementation(async (data) =>
      makeSession({ ...data, candidateId: data.candidateId })
    ),
    setReferenceFrameIfMissing: vi.fn(),
    applySignalResult: vi.fn().mockImplementation(async () => existing),
    markCompleted: vi.fn().mockResolvedValue(existing),
  };

  const eventRepository = {
    recordMany: vi.fn(),
    updateStatusInSession: vi.fn().mockResolvedValue(null),
  };

  const agent = {
    provider: "test",
    analyze: vi.fn().mockResolvedValue({ flags: [], trustScoreDelta: 0 }),
  };

  const resolvers = {
    [ProctoredSubjectType.INTERVIEW]: vi.fn().mockResolvedValue(null),
    [ProctoredSubjectType.MCQ_ATTEMPT]: vi
      .fn()
      .mockResolvedValue({ candidateId: CANDIDATE_ID, organizationId: ORG_ID }),
  };

  const service = new ProctoringService(
    repository as never,
    eventRepository as never,
    agent as never,
    resolvers
  );

  return { service, repository, eventRepository, agent, resolvers };
}

describe("ProctoringService ownership", () => {

  it("creates a session for the subject's own candidate, taking the org from the subject", async () => {

    const { service, repository, resolvers } = makeService();

    await service.startSession(ProctoredSubjectType.MCQ_ATTEMPT, SUBJECT_ID, CANDIDATE_ID, true);

    expect(resolvers[ProctoredSubjectType.MCQ_ATTEMPT]).toHaveBeenCalledWith(SUBJECT_ID);
    expect(repository.createForSubject).toHaveBeenCalledWith(
      expect.objectContaining({
        subjectType: ProctoredSubjectType.MCQ_ATTEMPT,
        organizationId: new Types.ObjectId(ORG_ID),
        consentGivenAt: expect.any(Date),
      })
    );

  });

  it("refuses to open a session on someone else's subject", async () => {

    const { service, repository } = makeService();

    await expect(
      service.startSession(ProctoredSubjectType.MCQ_ATTEMPT, SUBJECT_ID, OTHER_USER_ID)
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(repository.createForSubject).not.toHaveBeenCalled();

  });

  it("404s when the subject doesn't exist", async () => {

    const { service } = makeService();

    await expect(
      service.startSession(ProctoredSubjectType.INTERVIEW, SUBJECT_ID, CANDIDATE_ID)
    ).rejects.toMatchObject({ statusCode: 404 });

  });

  it("refuses signals from anyone but the candidate on an existing session", async () => {

    const { service, agent } = makeService(makeSession());

    await expect(
      service.recordSignal(ProctoredSubjectType.MCQ_ATTEMPT, SUBJECT_ID, OTHER_USER_ID, {
        tabFocused: false,
      })
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(agent.analyze).not.toHaveBeenCalled();

  });

  it("doesn't re-check the subject for every signal on an existing session", async () => {

    const { service, resolvers, agent } = makeService(makeSession());

    await service.recordSignal(ProctoredSubjectType.MCQ_ATTEMPT, SUBJECT_ID, CANDIDATE_ID, {
      tabFocused: true,
    });

    expect(resolvers[ProctoredSubjectType.MCQ_ATTEMPT]).not.toHaveBeenCalled();
    expect(agent.analyze).toHaveBeenCalledWith(
      expect.objectContaining({ subjectType: ProctoredSubjectType.MCQ_ATTEMPT, subjectId: SUBJECT_ID })
    );

  });

  it("only backfills a missing reference frame on rejoin", async () => {

    const { service, repository } = makeService(makeSession());

    await service.startSession(
      ProctoredSubjectType.MCQ_ATTEMPT,
      SUBJECT_ID,
      CANDIDATE_ID,
      true,
      "1.0",
      "data:image/jpeg;base64,abc"
    );

    expect(repository.setReferenceFrameIfMissing).toHaveBeenCalled();
    expect(repository.createForSubject).not.toHaveBeenCalled();

  });

});

describe("ProctoringService completion and review", () => {

  it("treats completing a never-proctored subject as a no-op", async () => {

    const { service, repository } = makeService(null);

    await expect(service.completeSessionForSubject(SUBJECT_ID)).resolves.toBeNull();
    expect(repository.markCompleted).not.toHaveBeenCalled();

  });

  it("scopes event review to the session, so an event from another session 404s", async () => {

    const session = makeSession();
    const { service, eventRepository } = makeService(session);

    await expect(
      service.updateEventStatus(
        SUBJECT_ID,
        new Types.ObjectId().toString(),
        ProctoringEventStatus.DISMISSED,
        OTHER_USER_ID,
        UserRole.RECRUITER
      )
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(eventRepository.updateStatusInSession).toHaveBeenCalledWith(
      expect.any(String),
      session._id,
      ProctoringEventStatus.DISMISSED
    );

  });

});
