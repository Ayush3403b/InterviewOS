import { describe, expect, it, vi } from "vitest";
import { AiUsageAlertService } from "../../../modules/ai-usage/services/AiUsageAlertService";
import { AiCallLogRepository } from "../../../modules/ai-usage/repositories/AiCallLogRepository";

describe("AiUsageAlertService", () => {
  it("classifies spend under 75% as NORMAL with no alerts", async () => {
    const fakeRepo = {
      summarize: vi.fn().mockResolvedValue({
        totals: { totalEstimatedCostUsd: 10.0 },
        byProvider: [],
        byPrompt: [],
      }),
    } as unknown as AiCallLogRepository;

    const alertService = new AiUsageAlertService(fakeRepo, 25.0, 500.0);
    const report = await alertService.getBudgetStatus();

    expect(report.dailyStatus).toBe("NORMAL");
    expect(report.overallStatus).toBe("NORMAL");
    expect(report.alerts).toHaveLength(0);
    expect(report.dailyUtilizationPercent).toBe(40);
  });

  it("triggers a WARNING alert when daily spend reaches 75%", async () => {
    const fakeRepo = {
      summarize: vi.fn().mockResolvedValue({
        totals: { totalEstimatedCostUsd: 20.0 },
        byProvider: [],
        byPrompt: [],
      }),
    } as unknown as AiCallLogRepository;

    const alertService = new AiUsageAlertService(fakeRepo, 25.0, 500.0);
    const report = await alertService.getBudgetStatus();

    expect(report.dailyStatus).toBe("WARNING");
    expect(report.overallStatus).toBe("WARNING");
    expect(report.alerts.length).toBeGreaterThan(0);
    expect(report.alerts[0]).toContain("approaching limit");
  });

  it("triggers an EXCEEDED alert when spend crosses 100%", async () => {
    const fakeRepo = {
      summarize: vi.fn().mockResolvedValue({
        totals: { totalEstimatedCostUsd: 30.0 },
        byProvider: [],
        byPrompt: [],
      }),
    } as unknown as AiCallLogRepository;

    const alertService = new AiUsageAlertService(fakeRepo, 25.0, 500.0);
    const report = await alertService.getBudgetStatus();

    expect(report.dailyStatus).toBe("EXCEEDED");
    expect(report.overallStatus).toBe("EXCEEDED");
    expect(report.alerts.length).toBeGreaterThan(0);
    expect(report.alerts[0]).toContain("budget exceeded");
  });
});
