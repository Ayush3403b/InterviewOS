import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

import type { ResumeAnalysis } from "../types";

function scoreColor(score: number): string {
  if (score >= 75) return "text-live";
  if (score >= 50) return "text-warn";
  return "text-danger";
}

export function ResumeAnalysisCard({ resume }: { resume: ResumeAnalysis }) {
  if (resume.status === "PROCESSING") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-line bg-panel p-5 text-sm text-ink-soft">
        <Loader2 className="h-4 w-4 animate-spin" />
        Analyzing {resume.fileName}...
      </div>
    );
  }

  if (resume.status === "FAILED") {
    return (
      <div className="rounded-xl border border-line bg-panel p-5">
        <div className="flex items-center gap-2 text-sm text-danger">
          <AlertTriangle className="h-4 w-4" />
          Analysis failed for {resume.fileName}
        </div>
        {resume.failureReason && (
          <p className="mt-1.5 text-xs text-ink-soft">
            {resume.failureReason}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-panel p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-ink">
          <CheckCircle2 className="h-4 w-4 text-live" />
          {resume.fileName}
        </div>

        {resume.atsScore !== undefined && (
          <span className={`font-display text-lg font-semibold ${scoreColor(resume.atsScore)}`}>
            {resume.atsScore}/100
          </span>
        )}
      </div>

      {resume.summary && (
        <p className="mt-3 text-sm text-ink-soft">{resume.summary}</p>
      )}

      {resume.extractedSkills.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">
            Detected skills
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {resume.extractedSkills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-signal/10 px-2.5 py-1 text-xs font-medium text-signal"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {resume.suggestions.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">
            Suggestions
          </p>
          <ul className="mt-2 space-y-1.5">
            {resume.suggestions.map((suggestion, index) => (
              <li key={index} className="text-sm text-ink-soft">
                - {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {resume.missingSkills.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">
            Skills to consider adding
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {resume.missingSkills.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-dashed border-line px-2.5 py-1 text-xs font-medium text-ink-soft"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {resume.experience.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">
            Experience
          </p>
          <div className="mt-2 space-y-2.5">
            {resume.experience.map((entry, index) => (
              <div key={index} className="text-sm">
                <p className="font-medium text-ink">
                  {entry.title}
                  {entry.company && ` · ${entry.company}`}
                </p>
                {entry.duration && (
                  <p className="text-xs text-ink-soft">{entry.duration}</p>
                )}
                {entry.highlights.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {entry.highlights.map((highlight, hIndex) => (
                      <li key={hIndex} className="text-xs text-ink-soft">
                        - {highlight}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {resume.education.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">
            Education
          </p>
          <div className="mt-2 space-y-1.5">
            {resume.education.map((entry, index) => (
              <p key={index} className="text-sm text-ink">
                {entry.degree}
                {entry.institution && ` · ${entry.institution}`}
                {entry.year && ` · ${entry.year}`}
              </p>
            ))}
          </div>
        </div>
      )}

      {resume.projects.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">
            Projects
          </p>
          <div className="mt-2 space-y-2">
            {resume.projects.map((entry, index) => (
              <div key={index} className="text-sm">
                <p className="font-medium text-ink">{entry.name}</p>
                {entry.description && (
                  <p className="text-xs text-ink-soft">{entry.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {resume.certifications.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">
            Certifications
          </p>
          <ul className="mt-2 space-y-1">
            {resume.certifications.map((cert, index) => (
              <li key={index} className="text-sm text-ink-soft">
                - {cert}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
