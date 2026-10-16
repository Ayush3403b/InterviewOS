import { describe, expect, it, vi } from "vitest";

import AuditLogService from "../../../modules/audit-log/services/AuditLogService";
import { AuditAction } from "../../../modules/audit-log/types/audit-log.types";

function makeFakeRepository(overrides: Partial<{
  record: ReturnType<typeof vi.fn>;
  search: ReturnType<typeof vi.fn>;
}> = {}) {
  return {
    record: overrides.record ?? vi.fn().mockResolvedValue({}),
    search: overrides.search ?? vi.fn().mockResolvedValue({
      entries: [],
      total: 0,
      page: 1,
      limit: 50,
    }),
  };
}

describe("AuditLogService", () => {

  it("writes through to the repository on success", async () => {

    const repository = makeFakeRepository();
    const service = new AuditLogService(repository as never);

    await service.record({
      action: AuditAction.LOGIN_SUCCESS,
      actorId: "user-1",
      ipAddress: "127.0.0.1",
    });

    expect(repository.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.LOGIN_SUCCESS,
        actorId: "user-1",
      })
    );

  });

  it("never throws, even when the repository write fails", async () => {

    const repository = makeFakeRepository({
      record: vi.fn().mockRejectedValue(new Error("db down")),
    });
    const service = new AuditLogService(repository as never);

    await expect(
      service.record({ action: AuditAction.LOGIN_FAILED })
    ).resolves.toBeUndefined();

  });

  it("delegates search to the repository and returns its result", async () => {

    const searchResult = {
      entries: [{ id: "1" }],
      total: 1,
      page: 1,
      limit: 50,
    };
    const repository = makeFakeRepository({
      search: vi.fn().mockResolvedValue(searchResult),
    });
    const service = new AuditLogService(repository as never);

    const result = await service.search({ actorId: "user-1" });

    expect(repository.search).toHaveBeenCalledWith({ actorId: "user-1" });
    expect(result).toEqual(searchResult);

  });

});
