import { BookOpen, Compass, Target } from "lucide-react";

import type { CoachingPlan } from "../types";

const PRIORITY_STYLES: Record<string, string> = {
  HIGH: "bg-danger/10 text-danger",
  MEDIUM: "bg-warn/10 text-warn",
  LOW: "bg-line/60 text-ink-soft",
};

export function CoachingPlanCard({ plan }: { plan: CoachingPlan }) {
  return (
    <div className="rounded-xl border border-line bg-panel p-5">
      <div className="flex items-center gap-2">
        <Compass className="h-4 w-4 text-signal" />
        <p className="text-sm font-medium text-ink">Your coaching plan</p>
      </div>

      <p className="mt-3 text-sm text-ink-soft">{plan.personalizedFeedback}</p>

      {plan.weakTopics.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">
            Focus areas
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {plan.weakTopics.map((topic) => (
              <span
                key={topic}
                className="rounded-full bg-signal/10 px-2.5 py-1 text-xs font-medium text-signal"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {plan.learningRoadmap.length > 0 && (
        <div className="mt-4">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-soft">
            <Target className="h-3.5 w-3.5" />
            Learning roadmap
          </p>
          <div className="mt-2 space-y-2">
            {plan.learningRoadmap.map((item, index) => (
              <div key={index} className="flex items-start gap-2.5 text-sm">
                <span
                  className={`mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${PRIORITY_STYLES[item.priority] ?? PRIORITY_STYLES.LOW}`}
                >
                  {item.priority}
                </span>
                <div>
                  <p className="font-medium text-ink">{item.topic}</p>
                  <p className="text-xs text-ink-soft">{item.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {plan.recommendedResources.length > 0 && (
        <div className="mt-4">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-soft">
            <BookOpen className="h-3.5 w-3.5" />
            Recommended resources
          </p>
          <div className="mt-2 space-y-2">
            {plan.recommendedResources.map((resource, index) => (
              <div key={index} className="text-sm">
                {resource.url ? (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-signal hover:underline"
                  >
                    {resource.title}
                  </a>
                ) : (
                  <p className="font-medium text-ink">{resource.title}</p>
                )}
                <p className="text-xs text-ink-soft">{resource.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {plan.careerGuidance && (
        <p className="mt-4 rounded-lg bg-surface px-3.5 py-3 text-sm text-ink-soft">
          {plan.careerGuidance}
        </p>
      )}
    </div>
  );
}
