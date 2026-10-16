import { Link } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";

import type { EvaluationResult, SkillScores } from "../types";

const RECOMMENDATION_STYLES: Record<string, string> = {
  STRONG_HIRE: "bg-live/10 text-live",
  HIRE: "bg-live/10 text-live",
  BORDERLINE: "bg-warn/10 text-warn",
  NO_HIRE: "bg-danger/10 text-danger",
};

const RECOMMENDATION_LABELS: Record<string, string> = {
  STRONG_HIRE: "Strong hire",
  HIRE: "Hire",
  BORDERLINE: "Borderline",
  NO_HIRE: "No hire",
};

const SKILL_LABELS: Record<keyof SkillScores, string> = {
  technical: "Technical",
  communication: "Communication",
  problemSolving: "Problem solving",
  confidence: "Confidence",
  leadership: "Leadership",
  criticalThinking: "Critical thinking",
};

function SkillBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-ink">{label}</span>
        <span className="text-ink-soft">{value}/100</span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-line">
        <div
          className="h-1.5 rounded-full bg-signal"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

export function EvaluationSummary({
  evaluation,
}: {
  evaluation: EvaluationResult;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-panel p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-signal">
              Interview complete
            </p>
            <p className="font-display mt-1 text-3xl font-semibold text-ink">
              {evaluation.overallScore}
              <span className="text-lg text-ink-soft">/100</span>
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              RECOMMENDATION_STYLES[evaluation.hiringRecommendation] ??
              "bg-line/60 text-ink-soft"
            }`}
          >
            {RECOMMENDATION_LABELS[evaluation.hiringRecommendation] ??
              evaluation.hiringRecommendation}
          </span>
        </div>

        {evaluation.overallSummary && (
          <p className="mt-3 text-sm text-ink-soft">
            {evaluation.overallSummary}
          </p>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {(Object.keys(SKILL_LABELS) as (keyof SkillScores)[]).map(
            (key) => (
              <SkillBar
                key={key}
                label={SKILL_LABELS[key]}
                value={evaluation.skillScores[key]}
              />
            )
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-panel p-5">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <CheckCircle2 className="h-4 w-4 text-live" />
            Strengths
          </h3>
          <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
            {evaluation.strengths.length === 0 && <li>—</li>}
            {evaluation.strengths.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-line bg-panel p-5">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <XCircle className="h-4 w-4 text-danger" />
            Areas to improve
          </h3>
          <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
            {evaluation.weaknesses.length === 0 && <li>—</li>}
            {evaluation.weaknesses.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      </div>

      {evaluation.recommendations.length > 0 && (
        <div className="rounded-2xl border border-line bg-panel p-5">
          <h3 className="text-sm font-semibold text-ink">Recommendations</h3>
          <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
            {evaluation.recommendations.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      )}

      <Link
        to="/app"
        className="inline-block text-sm font-medium text-signal"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
