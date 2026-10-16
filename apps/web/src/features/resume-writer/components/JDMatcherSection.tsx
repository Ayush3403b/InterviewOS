import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Copy,
  FileText,
  Lightbulb,
  Sparkles,
  Target,
  XCircle,
} from "lucide-react";

import { getApiErrorMessage } from "../../../lib/apiClient";
import { useJDMatch } from "../useResumeWriter";
import type { JDMatchResult } from "../types";

interface JDMatcherSectionProps {
  initialResumeText?: string;
  onApplyTailoredContent?: (summary: string, bullets: string[]) => void;
}

const SAMPLE_ROLES: Array<{ label: string; role: string; jd: string }> = [
  {
    label: "Senior Full Stack",
    role: "Senior Full Stack Engineer",
    jd: "Looking for a Senior Full Stack Engineer with 4+ years of experience in React, TypeScript, Node.js, Express, and PostgreSQL. Must have experience with Docker, CI/CD pipelines, REST & GraphQL APIs, and building high-performance scalable web applications.",
  },
  {
    label: "Backend & Cloud",
    role: "Backend Cloud Engineer",
    jd: "Seeking a Backend Engineer proficient in Node.js, Python, AWS, Docker, Kubernetes, and MongoDB. Experience in distributed microservices, message queues (Kafka/RabbitMQ), and API rate limiting is highly desired.",
  },
  {
    label: "Frontend Specialist",
    role: "Senior Frontend Engineer",
    jd: "We are hiring a Senior Frontend Engineer specialized in React 18+, TypeScript, Tailwind CSS, Next.js, and browser performance optimization. Strong grasp of state management, Vitest/Jest, and accessibility (a11y) required.",
  },
];

export function JDMatcherSection({
  initialResumeText = "",
  onApplyTailoredContent,
}: JDMatcherSectionProps) {
  const [resumeText, setResumeText] = useState(initialResumeText);
  const [jobDescription, setJobDescription] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const jdMatch = useJDMatch();

  const handleSelectSample = (sample: (typeof SAMPLE_ROLES)[0]) => {
    setTargetRole(sample.role);
    setJobDescription(sample.jd);
  };

  const handleCopyBullet = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopySummary = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const canAnalyze =
    resumeText.trim().length >= 10 &&
    jobDescription.trim().length >= 10 &&
    !jdMatch.isPending;

  const handleAnalyze = () => {
    jdMatch.mutate({
      resumeText: resumeText.trim(),
      jobDescription: jobDescription.trim(),
      targetRole: targetRole.trim() || undefined,
    });
  };

  const data: JDMatchResult | undefined = jdMatch.data;

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="rounded-xl border border-line bg-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-signal" />
            <h2 className="text-sm font-semibold text-ink">
              Target Job Description (JD) Matcher &amp; Tailor
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-ink-soft">
            <span>Presets:</span>
            {SAMPLE_ROLES.map((sample) => (
              <button
                key={sample.label}
                type="button"
                onClick={() => handleSelectSample(sample)}
                className="rounded-md border border-line bg-surface px-2 py-0.5 text-xs text-ink-soft transition-colors hover:border-signal hover:text-signal"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-1 text-xs text-ink-soft">
          Compare your resume directly against any target job opening. Get an ATS
          compatibility score, identify missing core keywords, and receive tailored
          bullet points to maximize interview callbacks.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Target Role & JD Input */}
          <div className="flex flex-col space-y-2">
            <label className="text-xs font-medium text-ink">
              1. Target Job Description
            </label>
            <input
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="Target Role Title (e.g. Senior Frontend Engineer)"
              maxLength={200}
              className="w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-xs text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-signal/30"
            />
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the target job description or requirements here..."
              rows={6}
              maxLength={10000}
              className="w-full flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-signal/30"
            />
          </div>

          {/* Candidate Resume Text */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-ink">
                2. Candidate Resume Text
              </label>
              {initialResumeText && resumeText !== initialResumeText && (
                <button
                  type="button"
                  onClick={() => setResumeText(initialResumeText)}
                  className="text-[11px] text-signal hover:underline"
                >
                  Reset to uploaded resume
                </button>
              )}
            </div>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume content or experience highlights..."
              rows={8}
              maxLength={20000}
              className="w-full flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-signal/30"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-[11px] text-ink-soft">
            {jobDescription.length}/10,000 JD chars • {resumeText.length}/20,000 resume chars
          </span>
          <button
            type="button"
            disabled={!canAnalyze}
            onClick={handleAnalyze}
            className="inline-flex items-center gap-2 rounded-lg bg-signal px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-signal-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {jdMatch.isPending ? "Analyzing Alignment..." : "Analyze JD Match"}
          </button>
        </div>

        {jdMatch.isError && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-danger">
            <AlertTriangle className="h-3.5 w-3.5" />
            {getApiErrorMessage(jdMatch.error)}
          </p>
        )}
      </div>

      {/* Results Section */}
      {data && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-line bg-panel p-4">
              <p className="text-xs font-medium text-ink-soft">ATS Match Score</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span
                  className={`text-3xl font-bold ${
                    data.matchScore >= 75
                      ? "text-live"
                      : data.matchScore >= 50
                      ? "text-warn"
                      : "text-danger"
                  }`}
                >
                  {data.matchScore}%
                </span>
                <span className="text-xs text-ink-soft">
                  {data.matchScore >= 75
                    ? "Strong Candidate Match"
                    : data.matchScore >= 50
                    ? "Moderate Alignment"
                    : "Keyword Gap Detected"}
                </span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface">
                <div
                  className={`h-full transition-all duration-500 ${
                    data.matchScore >= 75
                      ? "bg-live"
                      : data.matchScore >= 50
                      ? "bg-warn"
                      : "bg-danger"
                  }`}
                  style={{ width: `${data.matchScore}%` }}
                />
              </div>
            </div>

            <div className="rounded-xl border border-line bg-panel p-4">
              <div className="flex items-center gap-1.5 text-xs font-medium text-live">
                <CheckCircle2 className="h-4 w-4" />
                <span>Matching Skills ({data.matchingKeywords.length})</span>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {data.matchingKeywords.length > 0 ? (
                  data.matchingKeywords.map((kw, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-live/10 px-2 py-0.5 text-xs font-medium text-live"
                    >
                      {kw}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-ink-soft">No direct matches identified.</span>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-line bg-panel p-4">
              <div className="flex items-center gap-1.5 text-xs font-medium text-danger">
                <XCircle className="h-4 w-4" />
                <span>Missing Key Skills ({data.missingKeywords.length})</span>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {data.missingKeywords.length > 0 ? (
                  data.missingKeywords.map((kw, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger"
                    >
                      {kw}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-live">All key keywords covered!</span>
                )}
              </div>
            </div>
          </div>

          {/* Tailored Professional Summary */}
          {data.tailoredSummary && (
            <div className="rounded-xl border border-line bg-panel p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-signal" />
                  <h3 className="text-sm font-semibold text-ink">
                    Tailored Professional Summary ({data.targetRole})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopySummary(data.tailoredSummary)}
                  className="inline-flex items-center gap-1 rounded-md border border-line bg-surface px-2.5 py-1 text-xs text-ink-soft transition-colors hover:border-signal hover:text-signal"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copiedSummary ? "Copied!" : "Copy Summary"}
                </button>
              </div>
              <p className="mt-3 rounded-lg bg-surface p-3 text-xs leading-relaxed text-ink">
                {data.tailoredSummary}
              </p>
            </div>
          )}

          {/* Tailored Bullets */}
          {data.tailoredBulletPoints && data.tailoredBulletPoints.length > 0 && (
            <div className="rounded-xl border border-line bg-panel p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-signal" />
                  <h3 className="text-sm font-semibold text-ink">
                    ATS-Optimized Achievement Bullets
                  </h3>
                </div>
                {onApplyTailoredContent && (
                  <button
                    type="button"
                    onClick={() =>
                      onApplyTailoredContent(
                        data.tailoredSummary,
                        data.tailoredBulletPoints.map((b) => b.tailoredBullet)
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-md bg-signal/10 px-3 py-1 text-xs font-medium text-signal hover:bg-signal/20"
                  >
                    <span>Apply to Resume Exporter</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs text-ink-soft">
                Rewritten with high-impact action verbs, target keywords, and quantified
                metrics.
              </p>

              <div className="mt-4 space-y-3">
                {data.tailoredBulletPoints.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-line bg-surface p-3 text-xs"
                  >
                    {item.originalBullet && (
                      <div className="mb-2 text-ink-soft line-through opacity-75">
                        {item.originalBullet}
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium text-ink leading-relaxed">
                        • {item.tailoredBullet}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleCopyBullet(item.tailoredBullet, idx)}
                        className="inline-flex items-center gap-1 shrink-0 rounded px-1.5 py-0.5 text-[11px] text-ink-soft hover:bg-panel hover:text-signal"
                        title="Copy bullet"
                      >
                        {copiedIndex === idx ? (
                          <span className="text-live font-medium">Copied!</span>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Keywords & Rationale */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-line/60 pt-2 text-[11px]">
                      {item.highlightedKeywords && item.highlightedKeywords.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-ink-soft">Target Keywords:</span>
                          {item.highlightedKeywords.map((kw, k) => (
                            <span
                              key={k}
                              className="rounded bg-signal/10 px-1.5 py-0.2 text-[10px] font-medium text-signal"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                      <span className="text-ink-soft italic">
                        💡 {item.rationale}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {data.recommendations && data.recommendations.length > 0 && (
            <div className="rounded-xl border border-line bg-panel p-5">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-warn" />
                <h3 className="text-sm font-semibold text-ink">
                  High-Impact Application Recommendations
                </h3>
              </div>
              <ul className="mt-3 space-y-2">
                {data.recommendations.map((rec, r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2 rounded-lg bg-surface p-2.5 text-xs text-ink"
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-signal/10 text-[10px] font-bold text-signal">
                      {r + 1}
                    </span>
                    <span className="leading-relaxed">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
