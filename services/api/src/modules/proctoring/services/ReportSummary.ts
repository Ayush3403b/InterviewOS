import { ProctoringEventDocument } from "../types/proctoring.types";
import { RiskLevel } from "./RiskEngine";

/**
 * Generates the report's summary paragraph. This is deliberately
 * template-based, not an LLM call - same "deterministic fallback"
 * pattern already used elsewhere in this codebase (MockEvaluationAgent
 * etc). It's accurate and free, at the cost of reading a little more
 * mechanically than prose a language model would write. If you want
 * a more natural-reading summary, swap this out for a call to
 * whichever LLM provider the Evaluation Agent already uses, feeding
 * it this same `events` list - nothing else here has to change.
 */
export function generateSummary(params: {
  riskScore: number;
  riskLevel: RiskLevel;
  violationCount: number;
  totalEvents: number;
  topOffenses: Array<{ type: string; count: number }>;
  durationMs: number | null;
}): string {
  const { riskScore, riskLevel, violationCount, topOffenses, durationMs } = params;

  const durationText =
    durationMs != null
      ? `over ${Math.round(durationMs / 60_000)} minute(s)`
      : "";

  const openingByLevel: Record<RiskLevel, string> = {
    low: "This session showed no significant integrity concerns",
    medium: "This session showed a small number of minor concerns",
    high: "This session showed multiple or serious integrity concerns",
    critical: "This session showed severe or repeated integrity concerns",
  };

  const parts: string[] = [
    `${openingByLevel[riskLevel]} ${durationText}.`.replace("  ", " "),
    `Risk score: ${riskScore}/100 (${riskLevel}). Total violations logged: ${violationCount}.`,
  ];

  if (topOffenses.length > 0) {
    const list = topOffenses
      .map((offense) => `${humanizeType(offense.type)} (x${offense.count})`)
      .join(", ");
    parts.push(`Most frequent: ${list}.`);
  }

  return parts.join(" ");
}

function humanizeType(type: string): string {
  return type
    .toLowerCase()
    .split("_")
    .join(" ");
}

/** Top N most frequent violation types, for the summary's "most frequent" line. */
export function topOffenses(
  events: ProctoringEventDocument[],
  limit = 3
): Array<{ type: string; count: number }> {
  const counts = new Map<string, number>();

  for (const event of events) {
    counts.set(event.type, (counts.get(event.type) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([type, count]) => ({ type, count }));
}
