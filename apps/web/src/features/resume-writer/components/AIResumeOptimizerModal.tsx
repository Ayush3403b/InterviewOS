import { useState } from "react";
import { X, Sparkles, Loader2, CheckCircle2, TrendingUp, Download, Save, FileText } from "lucide-react";
import { optimizeAIResume, exportResumePdf } from "../api";
import type { OptimizedResume } from "../types";
import { getApiErrorMessage } from "../../../lib/apiClient";

interface AIResumeOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeId?: string;
  initialResumeText?: string;
  onOptimized?: (result: OptimizedResume) => void;
}

export function AIResumeOptimizerModal({
  isOpen,
  onClose,
  resumeId,
  initialResumeText = "",
  onOptimized,
}: AIResumeOptimizerModalProps) {
  const [targetRole, setTargetRole] = useState("Senior Full-Stack Engineer");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState(initialResumeText);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizedResume | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleOptimize = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    setSavedSuccess(false);

    try {
      const result = await optimizeAIResume({
        resumeId,
        resumeText: resumeText.trim() || undefined,
        jobDescription: jobDescription.trim() || undefined,
        targetRole: targetRole.trim() || undefined,
        saveToMongo: false,
      });

      setOptimizationResult(result);
      if (onOptimized) onOptimized(result);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to optimize resume"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToMongo = async () => {
    if (!resumeId && !optimizationResult) return;
    setIsSaving(true);
    setError(null);

    try {
      await optimizeAIResume({
        resumeId,
        resumeText: resumeText.trim() || undefined,
        jobDescription: jobDescription.trim() || undefined,
        targetRole: targetRole.trim() || undefined,
        saveToMongo: true,
      });
      setSavedSuccess(true);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update MongoDB"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!optimizationResult) return;
    setIsExporting(true);
    try {
      const blob = await exportResumePdf({
        fullName: "Candidate",
        title: targetRole,
        summary: optimizationResult.improvedSummary,
        skills: optimizationResult.skills,
        experience: (optimizationResult.experience || []).map((exp) => ({
          title: exp.title,
          company: exp.company,
          duration: exp.duration,
          bullets: exp.highlights || [],
        })),
        education: optimizationResult.education || [],
        projects: optimizationResult.projects || [],
        certifications: optimizationResult.certifications || [],
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `optimized-ats-resume.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to download PDF"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-100 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-400 border border-blue-500/20">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                AI Resume ATS Optimizer
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-mono text-emerald-400">
                  STAR BULLETS
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Tailor existing resume bullet points to job descriptions with quantified impact metrics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        {savedSuccess && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Successfully updated resume in MongoDB!</span>
          </div>
        )}

        {!optimizationResult ? (
          <form onSubmit={handleOptimize} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-300">Target Role</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Backend Engineer"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-300">Target Job Description (JD)</label>
                <textarea
                  rows={4}
                  placeholder="Paste the target job description to match keywords..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {!resumeId && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-300">Resume Content</label>
                <textarea
                  rows={6}
                  placeholder="Paste current resume text or experience highlights..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none font-mono"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-semibold text-white hover:bg-blue-500 transition shadow-lg shadow-blue-600/25 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Analyzing & Rewriting Bullet Points...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Run ATS Optimization</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-5">
            {/* ATS Score Improvement Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-xl bg-slate-950 p-4 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-slate-800 p-2.5 text-slate-300">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 uppercase font-mono">Original Score</span>
                  <p className="text-base font-bold text-slate-300">{optimizationResult.originalAtsScore} / 100</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400 border border-emerald-500/20">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[11px] text-emerald-500 uppercase font-mono">Optimized ATS Score</span>
                  <p className="text-base font-bold text-emerald-400">
                    {optimizationResult.optimizedAtsScore} / 100
                    <span className="ml-2 text-xs font-semibold text-emerald-300">
                      (+{optimizationResult.scoreImprovement} pts)
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                {resumeId && (
                  <button
                    type="button"
                    onClick={handleSaveToMongo}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition shadow-md"
                  >
                    {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    <span>Update in Database</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-md shadow-emerald-600/20"
                >
                  {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  <span>Export ATS PDF</span>
                </button>
              </div>
            </div>

            {/* Added Keywords */}
            {optimizationResult.addedKeywords && optimizationResult.addedKeywords.length > 0 && (
              <div className="rounded-xl border border-blue-500/20 bg-blue-950/20 p-3.5">
                <span className="text-xs font-medium text-blue-400 block mb-1.5">
                  High-Value ATS Keywords Injected:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {optimizationResult.addedKeywords.map((kw: string, i: number) => (
                    <span key={i} className="rounded-md bg-blue-500/20 border border-blue-500/30 px-2.5 py-0.5 text-xs text-blue-300 font-mono">
                      +{kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Improved Experience Bullets */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex flex-col gap-3">
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Upgraded STAR Experience Bullets
              </h4>
              <div className="flex flex-col gap-3">
                {(optimizationResult.experience || []).map((exp, i) => (
                  <div key={i} className="rounded-lg bg-slate-900/60 p-3 border border-slate-800">
                    <div className="flex items-center justify-between text-xs font-semibold text-white mb-1">
                      <span>{exp.title} • <span className="text-slate-400 font-normal">{exp.company}</span></span>
                      <span className="text-slate-500 font-mono text-[11px]">{exp.duration}</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-300">
                      {(exp.highlights || []).map((h: string, j: number) => (
                        <li key={j} className="leading-relaxed text-slate-200 font-medium">
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setOptimizationResult(null)}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
              >
                Re-optimize with Different Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
