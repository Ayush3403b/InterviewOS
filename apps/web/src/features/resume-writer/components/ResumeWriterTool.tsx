import { useState } from "react";
import {
  AlertTriangle,
  Download,
  FileSearch,
  Sparkles,
  Target,
  Wand2,
} from "lucide-react";

import { getApiErrorMessage } from "../../../lib/apiClient";
import { useGrammarCheck, useRewrite } from "../useResumeWriter";
import { JDMatcherSection } from "./JDMatcherSection";
import { ResumeExportModal } from "./ResumeExportModal";
import { AIResumeGeneratorModal } from "./AIResumeGeneratorModal";
import { AIResumeOptimizerModal } from "./AIResumeOptimizerModal";
import type { ExportResumeDto, GrammarIssueType } from "../types";
import type { ResumeAnalysis } from "../../resume/types";

interface ResumeWriterToolProps {
  currentResume?: ResumeAnalysis | null;
}

const ISSUE_LABELS: Record<GrammarIssueType, string> = {
  passive_voice: "Passive voice",
  weak_opener: "Weak opener",
  no_quantification: "No quantification",
  personal_pronoun: "Personal pronoun",
  repeated_word: "Repeated word",
  sentence_too_long: "Too long",
  other: "Other",
};

function scoreColor(score: number): string {
  if (score >= 80) return "text-live";
  if (score >= 50) return "text-warn";
  return "text-danger";
}

export function ResumeWriterTool({ currentResume }: ResumeWriterToolProps) {
  const [activeTab, setActiveTab] = useState<"jd-match" | "bullet-polish">("jd-match");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isOptimizerModalOpen, setIsOptimizerModalOpen] = useState(false);

  // Single bullet rewrite states
  const [text, setText] = useState("");
  const [targetRole, setTargetRole] = useState("");

  // Resume export initial payload
  const [exportData, setExportData] = useState<Partial<ExportResumeDto>>(() => {
    if (!currentResume) return {};
    return {
      fullName: "Candidate Name",
      summary: currentResume.summary || "",
      skills: currentResume.extractedSkills || [],
      experience: currentResume.experience?.map((exp) => ({
        title: exp.title,
        company: exp.company,
        duration: exp.duration,
        bullets: exp.highlights || [],
      })),
      education: currentResume.education?.map((edu) => ({
        degree: edu.degree,
        institution: edu.institution,
        year: edu.year,
      })),
      projects: currentResume.projects?.map((proj) => ({
        name: proj.name,
        description: proj.description,
        technologies: proj.technologies,
      })),
      certifications: currentResume.certifications || [],
    };
  });

  const grammarCheck = useGrammarCheck();
  const rewrite = useRewrite();

  const isBusy = grammarCheck.isPending || rewrite.isPending;
  const canSubmit = text.trim().length > 0 && !isBusy;

  // Build string representation from current uploaded resume if available
  const resumeRawText = currentResume
    ? [
        currentResume.summary ? `SUMMARY:\n${currentResume.summary}` : "",
        currentResume.extractedSkills?.length
          ? `SKILLS:\n${currentResume.extractedSkills.join(", ")}`
          : "",
        currentResume.experience?.length
          ? `EXPERIENCE:\n` +
            currentResume.experience
              .map(
                (exp) =>
                  `${exp.title} at ${exp.company} (${exp.duration})\n` +
                  (exp.highlights || []).map((h) => `• ${h}`).join("\n")
              )
              .join("\n\n")
          : "",
        currentResume.education?.length
          ? `EDUCATION:\n` +
            currentResume.education
              .map((edu) => `${edu.degree} - ${edu.institution} (${edu.year})`)
              .join("\n")
          : "",
      ]
        .filter(Boolean)
        .join("\n\n")
    : "";

  const handleApplyTailoredContent = (summary: string, bullets: string[]) => {
    setExportData((prev) => {
      const updatedExp = [...(prev.experience || [])];
      if (updatedExp.length > 0) {
        updatedExp[0] = {
          ...updatedExp[0],
          bullets: [...bullets, ...(updatedExp[0].bullets || [])].slice(0, 5),
        };
      } else {
        updatedExp.push({
          title: "Senior Engineer",
          company: "Experience",
          duration: "Present",
          bullets,
        });
      }

      return {
        ...prev,
        summary: summary || prev.summary,
        experience: updatedExp,
      };
    });

    setIsExportModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-panel p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-signal/10 text-signal">
            <Wand2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-ink">
              AI Resume Writer &amp; ATS Tailoring Studio
            </h2>
            <p className="text-xs text-ink-soft">
              Target job description matching, bullet point optimization, and ATS-ready export.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-line bg-surface p-1">
            <button
              type="button"
              onClick={() => setActiveTab("jd-match")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                activeTab === "jd-match"
                  ? "bg-signal text-white"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              <Target className="h-3.5 w-3.5" />
              Target JD Matcher
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("bullet-polish")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                activeTab === "bullet-polish"
                  ? "bg-signal text-white"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Bullet &amp; Grammar Polish
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsGenerateModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-300 transition-colors hover:bg-purple-500/20"
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            AI Generate Resume
          </button>

          <button
            type="button"
            onClick={() => setIsOptimizerModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-300 transition-colors hover:bg-blue-500/20"
          >
            <Wand2 className="h-3.5 w-3.5 text-blue-400" />
            AI ATS Optimizer
          </button>

          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-signal hover:text-signal"
          >
            <Download className="h-3.5 w-3.5 text-signal" />
            Export ATS PDF
          </button>
        </div>
      </div>

      {/* Tab 1: Target JD Matcher */}
      {activeTab === "jd-match" && (
        <JDMatcherSection
          initialResumeText={resumeRawText}
          onApplyTailoredContent={handleApplyTailoredContent}
        />
      )}

      {/* Tab 2: Bullet Polish & Grammar Tool */}
      {activeTab === "bullet-polish" && (
        <div className="rounded-xl border border-line bg-panel p-5">
          <div className="flex items-center gap-2">
            <FileSearch className="h-4 w-4 text-signal" />
            <p className="text-sm font-medium text-ink">
              Single Bullet &amp; Summary Rewriter
            </p>
          </div>
          <p className="mt-1 text-xs text-ink-soft">
            Paste an individual bullet point or summary phrase to eliminate passive voice,
            strengthen verbs, and quantify business impact.
          </p>

          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="e.g. I was responsible for managing a team of engineers and building backend APIs."
            rows={3}
            maxLength={4000}
            className="mt-3 w-full rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-signal/30"
          />

          <input
            value={targetRole}
            onChange={(event) => setTargetRole(event.target.value)}
            placeholder="Target role (optional) - e.g. senior backend engineer"
            maxLength={200}
            className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-xs text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-signal/30"
          />

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => grammarCheck.mutate(text)}
              className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
            >
              Check grammar
            </button>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() =>
                rewrite.mutate({ text, targetRole: targetRole.trim() || undefined })
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-signal px-3 py-1.5 text-xs font-medium text-white hover:bg-signal-strong disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Rewrite
            </button>
          </div>

          {grammarCheck.isError && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-danger">
              <AlertTriangle className="h-3.5 w-3.5" />
              {getApiErrorMessage(grammarCheck.error)}
            </p>
          )}

          {grammarCheck.data && (
            <div className="mt-4 border-t border-line pt-3">
              <p className="text-xs text-ink-soft">
                Score:{" "}
                <span className={`font-medium ${scoreColor(grammarCheck.data.score)}`}>
                  {grammarCheck.data.score}/100
                </span>
              </p>

              {grammarCheck.data.issues.length === 0 ? (
                <p className="mt-2 text-sm text-live">No issues found.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {grammarCheck.data.issues.map((issue, index) => (
                    <li key={index} className="rounded-lg bg-surface p-2.5 text-xs">
                      <span className="rounded-full bg-line/60 px-2 py-0.5 font-medium text-ink-soft">
                        {ISSUE_LABELS[issue.type]}
                      </span>
                      <p className="mt-1 text-ink">{issue.message}</p>
                      {issue.suggestion && (
                        <p className="mt-0.5 text-ink-soft">{issue.suggestion}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {rewrite.isError && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-danger">
              <AlertTriangle className="h-3.5 w-3.5" />
              {getApiErrorMessage(rewrite.error)}
            </p>
          )}

          {rewrite.data && (
            <div className="mt-4 border-t border-line pt-3">
              <p className="text-xs font-medium text-ink-soft">Suggested rewrite</p>
              <p className="mt-1 rounded-lg bg-surface p-2.5 text-xs text-ink">
                {rewrite.data.rewritten}
              </p>
              <p className="mt-1.5 text-xs text-ink-soft">{rewrite.data.explanation}</p>
            </div>
          )}
        </div>
      )}

      {/* PDF Export Modal */}
      <ResumeExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        initialData={exportData}
      />

      {/* AI Resume Generator Modal */}
      <AIResumeGeneratorModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        resumeId={currentResume?.id}
        currentResume={currentResume}
        onGenerated={(res) => {
          setExportData({
            fullName: res.fullName,
            title: res.targetRole,
            summary: res.summary,
            skills: res.skills,
            experience: (res.experience || []).map((e: any) => ({
              title: e.title,
              company: e.company,
              duration: e.duration,
              bullets: e.highlights || [],
            })),
            education: res.education,
            projects: res.projects,
            certifications: res.certifications,
          });
        }}
      />

      {/* AI Resume Optimizer Modal */}
      <AIResumeOptimizerModal
        isOpen={isOptimizerModalOpen}
        onClose={() => setIsOptimizerModalOpen(false)}
        resumeId={currentResume?.id}
        initialResumeText={resumeRawText}
        onOptimized={(res) => {
          setExportData((prev) => ({
            ...prev,
            summary: res.improvedSummary || prev.summary,
            skills: res.skills || prev.skills,
            experience: (res.experience || []).map((e: any) => ({
              title: e.title,
              company: e.company,
              duration: e.duration,
              bullets: e.highlights || [],
            })),
          }));
        }}
      />
    </div>
  );
}
