import { ArrowRight, Minus, Plus, TrendingDown, TrendingUp } from "lucide-react";

import { useCompareResumeVersions } from "../useResume";

function DeltaBadge({ value, suffix = "" }: { value: number | null; suffix?: string }) {
  if (value === null) {
    return <span className="text-xs text-ink-soft">—</span>;
  }
  if (value === 0) {
    return <span className="text-xs text-ink-soft">No change</span>;
  }

  const positive = value > 0;
  const Icon = positive ? TrendingUp : TrendingDown;

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${positive ? "text-live" : "text-danger"}`}
    >
      <Icon className="h-3 w-3" />
      {positive ? "+" : ""}
      {value}
      {suffix}
    </span>
  );
}

function SkillList({ skills, tone }: { skills: string[]; tone: "added" | "removed" }) {
  if (skills.length === 0) return null;

  const Icon = tone === "added" ? Plus : Minus;
  const color = tone === "added" ? "text-live" : "text-danger";

  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.map((skill) => (
        <span
          key={skill}
          className={`inline-flex items-center gap-1 rounded-full bg-line/60 px-2 py-0.5 text-xs ${color}`}
        >
          <Icon className="h-3 w-3" />
          {skill}
        </span>
      ))}
    </div>
  );
}

export interface ResumeComparisonViewProps {
  fromId: string;
  toId: string;
}

export function ResumeComparisonView({ fromId, toId }: ResumeComparisonViewProps) {
  const { data: comparison, isLoading, error } = useCompareResumeVersions(fromId, toId);

  if (isLoading) {
    return <p className="text-sm text-ink-soft">Comparing...</p>;
  }

  if (error || !comparison) {
    return (
      <p className="text-sm text-danger">
        Couldn't compare these two versions - make sure both have finished parsing.
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-xs text-ink-soft">
        <span className="truncate">{comparison.from.fileName}</span>
        <ArrowRight className="h-3 w-3 shrink-0" />
        <span className="truncate">{comparison.to.fileName}</span>
      </div>

      <p className="mt-2 text-sm text-ink">{comparison.summary}</p>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-ink-soft">ATS score</dt>
          <dd><DeltaBadge value={comparison.atsScoreDelta} /></dd>
        </div>
        <div>
          <dt className="text-xs text-ink-soft">Experience</dt>
          <dd><DeltaBadge value={comparison.experienceYearsDelta} suffix=" yrs" /></dd>
        </div>
        <div>
          <dt className="text-xs text-ink-soft">Projects</dt>
          <dd><DeltaBadge value={comparison.projectsCountDelta} /></dd>
        </div>
        <div>
          <dt className="text-xs text-ink-soft">Certifications</dt>
          <dd><DeltaBadge value={comparison.certificationsCountDelta} /></dd>
        </div>
        <div>
          <dt className="text-xs text-ink-soft">Skill gaps for role</dt>
          <dd><DeltaBadge value={comparison.missingSkillsForRoleDelta} /></dd>
        </div>
        {comparison.seniorityChanged && (
          <div>
            <dt className="text-xs text-ink-soft">Seniority</dt>
            <dd className="text-xs text-ink">
              {comparison.seniorityFrom} → {comparison.seniorityTo}
            </dd>
          </div>
        )}
      </dl>

      {(comparison.skillsAdded.length > 0 || comparison.skillsRemoved.length > 0) && (
        <div className="mt-3 space-y-1.5">
          <SkillList skills={comparison.skillsAdded} tone="added" />
          <SkillList skills={comparison.skillsRemoved} tone="removed" />
        </div>
      )}

      {comparison.newRecognizedCertifications.length > 0 && (
        <p className="mt-2 text-xs text-ink-soft">
          New certifications: {comparison.newRecognizedCertifications.join(", ")}
        </p>
      )}
    </div>
  );
}
