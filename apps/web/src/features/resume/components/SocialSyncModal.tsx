import { useState } from "react";
import { X, Loader2, Sparkles, RefreshCw, AlertCircle, Code2, Globe } from "lucide-react";
import { importGitHubProfile, importLinkedInProfile } from "../api";
import type { ResumeAnalysis } from "../types";

interface SocialSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (resume: ResumeAnalysis) => void;
}

type TabType = "github" | "linkedin";

export function SocialSyncModal({
  isOpen,
  onClose,
  onImportSuccess,
}: SocialSyncModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("github");
  const [githubUsername, setGithubUsername] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [linkedInData, setLinkedInData] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGitHubImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUsername.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const resume = await importGitHubProfile({
        username: githubUsername.trim(),
        githubToken: githubToken.trim() || undefined,
      });
      onImportSuccess(resume);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to import GitHub profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkedInImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkedInData.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const resume = await importLinkedInProfile({
        rawText: linkedInData.trim(),
      });
      onImportSuccess(resume);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to import LinkedIn profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-100 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-500/10 p-2 text-blue-400 border border-blue-500/20">
              <RefreshCw className="h-5 w-5 animate-spin [animation-duration:8s]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                Sync Candidate Profile
              </h2>
              <p className="text-xs text-slate-400">
                Auto-generate skills & experience directly from your profiles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-950 p-1 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setActiveTab("github");
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium transition ${
              activeTab === "github"
                ? "bg-slate-800 text-white shadow-sm border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Code2 className="h-4 w-4" />
            <span>GitHub Sync</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("linkedin");
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium transition ${
              activeTab === "linkedin"
                ? "bg-slate-800 text-white shadow-sm border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Globe className="h-4 w-4 text-blue-400" />
            <span>LinkedIn Sync</span>
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === "github" ? (
          <form onSubmit={handleGitHubImport} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-300">
                GitHub Username <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. torvalds or octocat"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                <span>Personal Access Token</span>
                <span className="text-[10px] text-slate-500 font-normal">Optional (higher rate limits)</span>
              </label>
              <input
                type="password"
                placeholder="ghp_xxxxxxxxxxxx"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-[11px] text-slate-400 flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                Extracts top programming languages, starred repositories, open-source portfolio metrics, and bio into a structured MongoDB resume.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !githubUsername.trim()}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Syncing GitHub...</span>
                  </>
                ) : (
                  <>
                    <Code2 className="h-3.5 w-3.5" />
                    <span>Sync Profile</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleLinkedInImport} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-300">
                LinkedIn Profile Summary or JSON Export <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={5}
                placeholder="Paste your LinkedIn 'About', 'Experience', and 'Skills' text or JSON export..."
                value={linkedInData}
                onChange={(e) => setLinkedInData(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !linkedInData.trim()}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Globe className="h-3.5 w-3.5" />
                    <span>Import LinkedIn</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
