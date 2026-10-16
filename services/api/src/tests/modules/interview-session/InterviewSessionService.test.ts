import { beforeEach, describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";

import InterviewSessionService from "../../../modules/interview-session/services/InterviewSessionService";
import { InterviewStatus } from "../../../modules/interview-session/types/interview-session.types";

const USER_ID = new Types.ObjectId().toString();
const SESSION_ID = new Types.ObjectId().toString();

/** Matches env.ts's defaults (60 min IN_PROGRESS, 24h PAUSED) - see
 *  that file if these ever change. */
const IN_PROGRESS_TIMEOUT_MS = 60 * 60 * 1000;
const PAUSED_TIMEOUT_MS = 24 * 60 * 60 * 1000;

function makeInterviewFixture(
  overrides: Partial<{ status: InterviewStatus; updatedAt: Date }> = {}
) {
  return {
    _id: SESSION_ID,
    userId: { toString: () => USER_ID },
    status: InterviewStatus.CREATED,
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeFakeRepository(interview: ReturnType<typeof makeInterviewFixture>) {
  return {
    findById: vi.fn().mockResolvedValue(interview),
    expireSession: vi.fn().mockResolvedValue({
      ...interview,
      status: InterviewStatus.EXPIRED,
    }),
    resetProgress: vi.fn().mockResolvedValue(interview),
  };
}

describe("InterviewSessionService staleness / auto-expiry", () => {

  let repository: ReturnType<typeof makeFakeRepository>;

  beforeEach(() => {
    vi.useRealTimers();
  });

  it("returns an IN_PROGRESS session as-is when it's still fresh", async () => {

    const interview = makeInterviewFixture({
      status: InterviewStatus.IN_PROGRESS,
      updatedAt: new Date(Date.now() - IN_PROGRESS_TIMEOUT_MS / 2),
    });
    repository = makeFakeRepository(interview);
    const service = new InterviewSessionService(repository as never);

    const result = await service.getSessionById(SESSION_ID, USER_ID);

    expect(result.status).toBe(InterviewStatus.IN_PROGRESS);
    expect(repository.expireSession).not.toHaveBeenCalled();

  });

  it("auto-expires an IN_PROGRESS session that's gone stale", async () => {

    const interview = makeInterviewFixture({
      status: InterviewStatus.IN_PROGRESS,
      updatedAt: new Date(Date.now() - IN_PROGRESS_TIMEOUT_MS - 1000),
    });
    repository = makeFakeRepository(interview);
    const service = new InterviewSessionService(repository as never);

    const result = await service.getSessionById(SESSION_ID, USER_ID);

    expect(repository.expireSession).toHaveBeenCalledWith(SESSION_ID);
    expect(result.status).toBe(InterviewStatus.EXPIRED);

  });

  it("returns a PAUSED session as-is when it's within the (longer) paused timeout", async () => {

    const interview = makeInterviewFixture({
      status: InterviewStatus.PAUSED,
      updatedAt: new Date(Date.now() - PAUSED_TIMEOUT_MS / 2),
    });
    repository = makeFakeRepository(interview);
    const service = new InterviewSessionService(repository as never);

    const result = await service.getSessionById(SESSION_ID, USER_ID);

    expect(result.status).toBe(InterviewStatus.PAUSED);
    expect(repository.expireSession).not.toHaveBeenCalled();

  });

  it("auto-expires a PAUSED session that's never been resumed", async () => {

    const interview = makeInterviewFixture({
      status: InterviewStatus.PAUSED,
      updatedAt: new Date(Date.now() - PAUSED_TIMEOUT_MS - 1000),
    });
    repository = makeFakeRepository(interview);
    const service = new InterviewSessionService(repository as never);

    const result = await service.getSessionById(SESSION_ID, USER_ID);

    expect(repository.expireSession).toHaveBeenCalledWith(SESSION_ID);
    expect(result.status).toBe(InterviewStatus.EXPIRED);

  });

  it("never expires a CREATED session, no matter how old", async () => {

    const interview = makeInterviewFixture({
      status: InterviewStatus.CREATED,
      updatedAt: new Date(Date.now() - PAUSED_TIMEOUT_MS * 10),
    });
    repository = makeFakeRepository(interview);
    const service = new InterviewSessionService(repository as never);

    const result = await service.getSessionById(SESSION_ID, USER_ID);

    expect(result.status).toBe(InterviewStatus.CREATED);
    expect(repository.expireSession).not.toHaveBeenCalled();

  });

  it("never expires an already-terminal COMPLETED session", async () => {

    const interview = makeInterviewFixture({
      status: InterviewStatus.COMPLETED,
      updatedAt: new Date(Date.now() - PAUSED_TIMEOUT_MS * 10),
    });
    repository = makeFakeRepository(interview);
    const service = new InterviewSessionService(repository as never);

    const result = await service.getSessionById(SESSION_ID, USER_ID);

    expect(result.status).toBe(InterviewStatus.COMPLETED);
    expect(repository.expireSession).not.toHaveBeenCalled();

  });

  it("allows resetting progress from an EXPIRED session", async () => {

    const interview = makeInterviewFixture({ status: InterviewStatus.EXPIRED });
    repository = makeFakeRepository(interview);
    const service = new InterviewSessionService(repository as never);

    await expect(
      service.resetProgress(SESSION_ID, USER_ID)
    ).resolves.toBeDefined();

  });

});
