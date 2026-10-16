import { AiCallLogRepository } from "../repositories/AiCallLogRepository";

export type BudgetStatus = "NORMAL" | "WARNING" | "CRITICAL" | "EXCEEDED";

export interface BudgetStatusReport {
  dailySpendUsd: number;
  dailyBudgetUsd: number;
  dailyUtilizationPercent: number;
  dailyStatus: BudgetStatus;

  monthlySpendUsd: number;
  monthlyBudgetUsd: number;
  monthlyUtilizationPercent: number;
  monthlyStatus: BudgetStatus;

  overallStatus: BudgetStatus;
  alerts: string[];
  lastEvaluatedAt: string;
}

export class AiUsageAlertService {
  private readonly dailyBudgetUsd: number;
  private readonly monthlyBudgetUsd: number;

  constructor(
    private readonly repository: AiCallLogRepository,
    dailyBudgetUsd?: number,
    monthlyBudgetUsd?: number
  ) {
    this.dailyBudgetUsd =
      dailyBudgetUsd ??
      Number(process.env.LLM_DAILY_BUDGET_USD ?? 25.0);
    this.monthlyBudgetUsd =
      monthlyBudgetUsd ??
      Number(process.env.LLM_MONTHLY_BUDGET_USD ?? 500.0);
  }

  private classifyStatus(spent: number, budget: number): { status: BudgetStatus; percent: number } {
    if (budget <= 0) return { status: "NORMAL", percent: 0 };
    const percent = Math.round((spent / budget) * 100);

    if (percent >= 100) return { status: "EXCEEDED", percent };
    if (percent >= 90) return { status: "CRITICAL", percent };
    if (percent >= 75) return { status: "WARNING", percent };
    return { status: "NORMAL", percent };
  }

  public async getBudgetStatus(): Promise<BudgetStatusReport> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [dailySummary, monthlySummary] = await Promise.all([
      this.repository.summarize({ fromDate: startOfDay }),
      this.repository.summarize({ fromDate: startOfMonth }),
    ]);

    // Calculate spend
    const dailySpendUsd = Number((dailySummary.totals?.totalEstimatedCostUsd ?? 0).toFixed(4));
    const monthlySpendUsd = Number((monthlySummary.totals?.totalEstimatedCostUsd ?? 0).toFixed(4));

    const dailyEval = this.classifyStatus(dailySpendUsd, this.dailyBudgetUsd);
    const monthlyEval = this.classifyStatus(monthlySpendUsd, this.monthlyBudgetUsd);

    const alerts: string[] = [];
    if (dailyEval.status === "EXCEEDED") {
      alerts.push(`Daily LLM budget exceeded: $${dailySpendUsd} / $${this.dailyBudgetUsd} (${dailyEval.percent}%)`);
    } else if (dailyEval.status === "CRITICAL" || dailyEval.status === "WARNING") {
      alerts.push(`Daily LLM spend approaching limit: $${dailySpendUsd} / $${this.dailyBudgetUsd} (${dailyEval.percent}%)`);
    }

    if (monthlyEval.status === "EXCEEDED") {
      alerts.push(`Monthly LLM budget exceeded: $${monthlySpendUsd} / $${this.monthlyBudgetUsd} (${monthlyEval.percent}%)`);
    } else if (monthlyEval.status === "CRITICAL" || monthlyEval.status === "WARNING") {
      alerts.push(`Monthly LLM spend approaching limit: $${monthlySpendUsd} / $${this.monthlyBudgetUsd} (${monthlyEval.percent}%)`);
    }

    const priorityOrder: Record<BudgetStatus, number> = {
      EXCEEDED: 4,
      CRITICAL: 3,
      WARNING: 2,
      NORMAL: 1,
    };

    const overallStatus =
      priorityOrder[dailyEval.status] >= priorityOrder[monthlyEval.status]
        ? dailyEval.status
        : monthlyEval.status;

    return {
      dailySpendUsd,
      dailyBudgetUsd: this.dailyBudgetUsd,
      dailyUtilizationPercent: dailyEval.percent,
      dailyStatus: dailyEval.status,

      monthlySpendUsd,
      monthlyBudgetUsd: this.monthlyBudgetUsd,
      monthlyUtilizationPercent: monthlyEval.percent,
      monthlyStatus: monthlyEval.status,

      overallStatus,
      alerts,
      lastEvaluatedAt: now.toISOString(),
    };
  }
}
