import { useState } from "react";
import { Download, FileText, AlertTriangle, ArrowRight, Share2, Copy, Check, ExternalLink, Globe } from "lucide-react";

import type { InterviewReport, SkillGap } from "../types";
import { useDownloadReportPdf, useShareReport, useRevokeShareReport } from "../useReport";

type NarrativeTab = "executive" | "candidate" | "recruiter" | "digest";

const TAB_LABELS: Record<NarrativeTab, string> = {
  executive: "Summary",
  candidate: "For You",
  recruiter: "Recruiter",
  digest: "Executive",
};

const SKILL_LABELS: Record<string, string> = {
  technical: "Technical",
  communication: "Communication",
  problemSolving: "Problem solving",
  confidence: "Confidence",
  leadership: "Leadership",
  criticalThinking: "Critical thinking",
};

const SKILL_KEYS = Object.keys(SKILL_LABELS);

// ── Radar Chart (pure SVG) ──────────────────────────────────────────────────

function RadarChart({ scores }: { scores: Record<string, number> }) {
  const cx = 120;
  const cy = 120;
  const maxR = 95;
  const axes = SKILL_KEYS.map((key, i) => {
    const angle = (Math.PI * 2 * i) / SKILL_KEYS.length - Math.PI / 2;
    return {
      key,
      label: SKILL_LABELS[key],
      angle,
      x: cx + maxR * Math.cos(angle),
      y: cy + maxR * Math.sin(angle),
    };
  });

  const scorePct = (key: string) =>
    Math.max(0, Math.min(100, scores[key] ?? 0)) / 100;

  const axisPoint = (ratio: number, angle: number) => ({
    x: cx + maxR * ratio * Math.cos(angle),
    y: cy + maxR * ratio * Math.sin(angle),
  });

  // Polygon vertices for candidate's scores
  const polygon = axes
    .map(({ key, angle }) => {
      const r = scorePct(key);
      const pt = axisPoint(r, angle);
      return `${pt.x},${pt.y}`;
    })
    .join(" ");

  // Background ring grid at 25%, 50%, 75%, 100%
  const rings = [0.25, 0.5, 0.75, 1].map((ratio) => {
    const pts = axes.map(({ angle }) => {
      const pt = axisPoint(ratio, angle);
      return `${pt.x},${pt.y}`;
    });
    return pts.join(" ");
  });

  return (
    <svg
      viewBox="0 0 240 240"
      className="w-full max-w-[200px] mx-auto"
      aria-label="Skill radar chart"
    >
      {/* Grid rings */}
      {rings.map((pts, i) => (
        <polygon
          key={i}
          points={pts}
          fill="none"
          stroke="currentColor"
          strokeWidth={0.8}
          className="text-line"
        />
      ))}

      {/* Axis lines */}
      {axes.map(({ key, x, y }) => (
        <line
          key={key}
          x1={cx}
          y1={cy}
          x2={x}
          y2={y}
          stroke="currentColor"
          strokeWidth={0.8}
          className="text-line"
        />
      ))}

      {/* Score polygon */}
      <polygon
        points={polygon}
        fill="currentColor"
        fillOpacity={0.15}
        stroke="currentColor"
        strokeWidth={1.5}
        className="text-signal"
      />

      {/* Axis labels */}
      {axes.map(({ key, angle }) => {
        const PAD = 14;
        const lx = cx + (maxR + PAD) * Math.cos(angle);
        const ly = cy + (maxR + PAD) * Math.sin(angle);
        const anchor =
          Math.abs(angle) < 0.2 || Math.abs(angle - Math.PI) < 0.2
            ? "middle"
            : Math.cos(angle) > 0
            ? "start"
            : "end";

        return (
          <text
            key={key}
            x={lx}
            y={ly}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize={8}
            fill="currentColor"
            className="text-ink-soft"
          >
            {SKILL_LABELS[key]}
          </text>
        );
      })}

      {/* Score dots */}
      {axes.map(({ key, angle }) => {
        const r = scorePct(key);
        const pt = axisPoint(r, angle);
        return (
          <circle
            key={key}
            cx={pt.x}
            cy={pt.y}
            r={2.5}
            fill="currentColor"
            className="text-signal"
          />
        );
      })}
    </svg>
  );
}

// ── Score bar ──────────────────────────────────────────────────────────────

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const color =
    pct >= 70 ? "bg-live" : pct >= 40 ? "bg-signal" : "bg-danger";

  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-ink">{label}</span>
        <span className="tabular-nums text-ink-soft">{value}/100</span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-line">
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Skill gap card ─────────────────────────────────────────────────────────

const PRIORITY_COLORS = {
  high: "border-danger/30 bg-danger/5 text-danger",
  medium: "border-signal/30 bg-signal/5 text-signal",
  low: "border-line bg-white/50 text-ink-soft",
};

function SkillGapCard({ gap }: { gap: SkillGap }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-lg border p-3 ${PRIORITY_COLORS[gap.priority]}`}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-2 text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="text-xs font-semibold capitalize truncate">
            {gap.skill}
          </span>
          <span className="text-[10px] uppercase tracking-wide font-medium opacity-75">
            {gap.priority}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 text-xs opacity-75">
          <span className="tabular-nums">{gap.currentLevel} → {gap.targetLevel}</span>
          <ArrowRight
            className={`h-3 w-3 transition-transform ${expanded ? "rotate-90" : ""}`}
          />
        </div>
      </button>

      {expanded && gap.actionableSteps.length > 0 && (
        <ul className="mt-2 space-y-1 pl-5">
          {gap.actionableSteps.map((step, i) => (
            <li
              key={i}
              className="text-[11px] leading-snug list-disc marker:opacity-60 text-inherit"
            >
              {step}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function ReportCard({ report }: { report: InterviewReport }) {
  const downloadPdf = useDownloadReportPdf(report.interviewSessionId);
  const [activeTab, setActiveTab] = useState<NarrativeTab>("executive");
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const shareMutation = useShareReport(report.interviewSessionId);
  const revokeMutation = useRevokeShareReport(report.interviewSessionId);

  const shareUrl = report.shareToken
    ? `${window.location.origin}/report/share/${report.shareToken}`
    : "";

  const handleCopyShareLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const narrativeContent: Record<NarrativeTab, string> = {
    executive: report.executiveSummary,
    candidate: report.candidateFeedback || report.executiveSummary,
    recruiter: report.recruiterBrief || report.executiveSummary,
    digest: report.executiveDigest || report.executiveSummary,
  };

  const skillEntries = Object.entries(report.skillScores).filter(
    ([key]) => key in SKILL_LABELS
  );

  const visibleGaps = (report.skillGaps ?? []).filter(
    (g) => g.currentLevel < g.targetLevel
  );

  return (
    <div className="rounded-xl border border-line bg-panel p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-signal" />
          <p className="text-sm font-medium text-ink">Interview report</p>
          {report.isPublic && (
            <span className="inline-flex items-center gap-1 rounded-full bg-live/10 px-2 py-0.5 text-[11px] font-medium text-live">
              <Globe className="h-3 w-3" />
              Public Link Active
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            id="report-share-link-btn"
            type="button"
            onClick={() => {
              setShowShareModal(!showShareModal);
              if (!report.shareToken) {
                shareMutation.mutate(30);
              }
            }}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink transition hover:border-signal/40"
          >
            <Share2 className="h-3.5 w-3.5 text-signal" />
            Share Report
          </button>

          <button
            id="report-download-pdf"
            onClick={() => downloadPdf.mutate()}
            disabled={downloadPdf.isPending}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink transition hover:border-signal/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-3.5 w-3.5" />
            {downloadPdf.isPending ? "Preparing PDF..." : "Download PDF"}
          </button>
        </div>
      </div>

      {/* Share Modal / Card */}
      {showShareModal && (
        <div className="rounded-lg border border-signal/30 bg-signal/5 p-4 text-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-medium text-ink">
              <Globe className="h-4 w-4 text-signal" />
              <span>Shareable Candidate Evaluation Link</span>
            </div>
            {report.isPublic && (
              <button
                type="button"
                onClick={() => revokeMutation.mutate()}
                disabled={revokeMutation.isPending}
                className="text-[11px] text-danger hover:underline"
              >
                {revokeMutation.isPending ? "Revoking..." : "Revoke public link"}
              </button>
            )}
          </div>

          <p className="text-ink-soft">
            Anyone with this secure link (e.g. hiring managers, team leads) can view this verified evaluation report without needing a login account.
          </p>

          {shareMutation.isPending ? (
            <p className="text-ink-soft italic">Generating secure link...</p>
          ) : shareUrl ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 rounded-md border border-line bg-white px-2.5 py-1.5 font-mono text-xs text-ink select-all"
              />
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="flex items-center gap-1 rounded-md bg-signal px-3 py-1.5 font-medium text-white hover:bg-signal-strong transition"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedLink ? "Copied!" : "Copy"}
              </button>
              <a
                href={shareUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 rounded-md border border-line bg-white px-2.5 py-1.5 text-ink hover:border-signal/40"
                title="Preview public view"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => shareMutation.mutate(30)}
              className="rounded-md bg-signal px-3 py-1 text-white font-medium hover:bg-signal-strong"
            >
              Generate Share Link (30 Days)
            </button>
          )}
        </div>
      )}

      {/* Narrative tabs */}
      <div>
        <div className="border-b border-line">
          <div className="flex gap-0.5">
            {(Object.keys(TAB_LABELS) as NarrativeTab[]).map((tab) => (
              <button
                key={tab}
                id={`report-tab-${tab}`}
                onClick={() => setActiveTab(tab)}
                className={`rounded-t px-3 py-1.5 text-xs font-medium transition ${
                  activeTab === tab
                    ? "border-b-2 border-signal text-signal"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-3 min-h-[3.5rem] text-sm text-ink-soft leading-relaxed">
          {narrativeContent[activeTab]}
        </p>
      </div>

      {/* Radar chart + skill score bars side by side on wider screens */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft/70 mb-3">
          Skill breakdown
        </p>
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          {/* Radar */}
          <div className="w-full sm:w-[200px] flex-shrink-0">
            <RadarChart scores={report.skillScores as unknown as Record<string, number>} />
          </div>
          {/* Bars */}
          <div className="flex-1 w-full grid gap-3 sm:grid-cols-1">
            {skillEntries.map(([key, value]) => (
              <ScoreBar
                key={key}
                label={SKILL_LABELS[key] ?? key}
                value={value as number}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Skill gaps */}
      {visibleGaps.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft/70 mb-3">
            Skill gaps ({visibleGaps.length})
          </p>
          <div className="space-y-2">
            {visibleGaps.map((gap, i) => (
              <SkillGapCard key={`${gap.skill}-${i}`} gap={gap} />
            ))}
          </div>
        </div>
      )}

      {/* Overall score */}
      <div className="flex items-center gap-6 border-t border-line pt-4">
        <div>
          <p className="text-xs text-ink-soft">Overall</p>
          <p className="font-display text-2xl font-semibold text-ink">
            {report.overallScore}
            <span className="text-sm text-ink-soft">/100</span>
          </p>
        </div>
        <div className="h-8 w-px bg-line" />
        <div className="flex-1">
          <p className="text-xs text-ink-soft">Verdict</p>
          <p className="text-sm font-medium text-ink capitalize">
            {report.hiringRecommendation.replace(/_/g, " ").toLowerCase()}
          </p>
        </div>
      </div>

      {downloadPdf.isError && (
        <p className="text-sm text-danger">
          Couldn't download the PDF. Try again.
        </p>
      )}
    </div>
  );
}
