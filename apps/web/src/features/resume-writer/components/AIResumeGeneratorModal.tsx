import { useState, useEffect } from "react";
import { X, Sparkles, Loader2, Download, ShieldCheck, Award, Briefcase, FileText, Code2, Globe, GraduationCap, CheckCircle2 } from "lucide-react";
import { generateAIResume, exportResumePdf } from "../api";
import { GitHubProjectSelector, type SelectedGitHubProject } from "./GitHubProjectSelector";
import type { ResumeAnalysis } from "../../resume/types";

interface AIResumeGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeId?: string;
  currentResume?: ResumeAnalysis | null;
  onGenerated?: (resumeData: any) => void;
}

export function AIResumeGeneratorModal({
  isOpen,
  onClose,
  resumeId,
  currentResume,
  onGenerated,
}: AIResumeGeneratorModalProps) {
  const [candidateName, setCandidateName] = useState("");
  const [targetRole, setTargetRole] = useState(
    currentResume?.experience?.[0]?.title || "Senior Full-Stack Engineer"
  );
  const [experienceLevel, setExperienceLevel] = useState<string>("senior");
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(5);
  const [skillsInput, setSkillsInput] = useState(
    currentResume?.extractedSkills && currentResume.extractedSkills.length > 0
      ? currentResume.extractedSkills.join(", ")
      : "TypeScript, React, Node.js, PostgreSQL, Docker, AWS, GraphQL"
  );
  const [industry, setIndustry] = useState("Software & Cloud Technology");
  const [githubUsername, setGithubUsername] = useState("");
  const [selectedProjects, setSelectedProjects] = useState<SelectedGitHubProject[]>([]);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [backgroundNotes, setBackgroundNotes] = useState(
    currentResume?.summary || ""
  );
  const [jobDescription, setJobDescription] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentResume) {
      if (currentResume.extractedSkills?.length) {
        setSkillsInput(currentResume.extractedSkills.join(", "));
      }
      if (currentResume.experience?.[0]?.title) {
        setTargetRole(currentResume.experience[0].title);
      }
      if (currentResume.summary) {
        setBackgroundNotes(currentResume.summary);
      }
    }
  }, [currentResume]);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const skills = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const result = await generateAIResume({
        resumeId: resumeId || currentResume?.id,
        resumeText: currentResume?.rawText,
        candidateName: candidateName.trim() || undefined,
        targetRole: targetRole.trim(),
        experienceLevel,
        yearsOfExperience: Number(yearsOfExperience) || 3,
        skills,
        industry: industry.trim() || undefined,
        githubUsername: githubUsername.trim() || undefined,
        linkedinUrl: linkedinUrl.trim() || undefined,
        selectedProjects: selectedProjects.length > 0 ? selectedProjects : undefined,
        backgroundNotes: backgroundNotes.trim() || undefined,
        jobDescription: jobDescription.trim() || undefined,
      });

      setGeneratedResult(result);
      if (onGenerated) onGenerated(result);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to generate resume");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!generatedResult) return;
    setIsExporting(true);
    try {
      const blob = await exportResumePdf({
        fullName: generatedResult.fullName || "Candidate",
        title: generatedResult.targetRole,
        linkedin: generatedResult.linkedin || (linkedinUrl.trim() || undefined),
        github: generatedResult.github || (githubUsername.trim() ? `https://github.com/${githubUsername.trim()}` : undefined),
        summary: generatedResult.summary,
        skills: generatedResult.skills,
        experience: (generatedResult.experience || []).map((exp: any) => ({
          title: exp.title,
          company: exp.company,
          duration: exp.duration,
          bullets: exp.highlights || [],
        })),
        education: generatedResult.education || [],
        projects: generatedResult.projects || [],
        certifications: generatedResult.certifications || [],
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${(generatedResult.fullName || "candidate")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")}-ats-resume.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.message || "Failed to download PDF");
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
            <div className="rounded-xl bg-purple-500/10 p-2.5 text-purple-400 border border-purple-500/20">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                AI ATS Resume Generator
                <span className="rounded-full bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 text-[11px] font-mono text-blue-400">
                  ATS OPTIMIZED
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Generate high-impact, ATS-parseable resumes tailored with STAR achievements
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

        {currentResume && (
          <div className="flex items-center gap-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3 text-xs text-indigo-200">
            <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
            <div className="flex-1">
              <span className="font-semibold text-indigo-300">Base Resume Connected:</span>{" "}
              Analyzing real work experience ({currentResume.experience?.length || 0} roles) and education ({currentResume.education?.length || 0} degrees). Real companies &amp; universities are strictly preserved and elevated into ATS-compliant STAR format.
            </div>
          </div>
        )}

        {/* View Switch: Form vs Generated Preview */}
        {!generatedResult ? (
          <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-300">Candidate Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Morgan"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Target Role <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Backend Engineer"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  required
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-300">Experience Level</label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="entry">Entry Level (0-2 yrs)</option>
                    <option value="mid">Mid Level (2-5 yrs)</option>
                    <option value="senior">Senior (5-8 yrs)</option>
                    <option value="lead">Staff / Lead (8+ yrs)</option>
                    <option value="executive">Executive</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-300">Years of Experience</label>
                  <input
                    type="number"
                    min={0}
                    max={40}
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Core Skills & Technologies <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Comma separated list of skills..."
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  required
                  className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-300">
                  LinkedIn Profile URL <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 text-xs">
                    linkedin.com/in/
                  </span>
                  <input
                    type="text"
                    placeholder="alexmorgan"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-32 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-300">Target Industry / Domain</label>
                <input
                  type="text"
                  placeholder="e.g. FinTech, Healthcare, SaaS"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* GitHub ID Integration & 2 Project Selector */}
              <GitHubProjectSelector
                githubUsername={githubUsername}
                onUsernameChange={setGithubUsername}
                selectedProjects={selectedProjects}
                onSelectedProjectsChange={setSelectedProjects}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-300">Background Notes or Key Projects</label>
                <textarea
                  rows={2}
                  placeholder="Any notable achievements, prior companies, or specific highlights..."
                  value={backgroundNotes}
                  onChange={(e) => setBackgroundNotes(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-300">Target Job Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Paste target job description to match exact ATS keyword frequency..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !targetRole.trim() || !skillsInput.trim()}
                className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-xs font-semibold text-white hover:bg-purple-500 transition shadow-lg shadow-purple-600/25 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Architecting ATS Resume...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Generate Complete Resume</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-5">
            {/* ATS Score Banner */}
            <div className="flex items-center justify-between rounded-xl bg-slate-950 p-4 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{generatedResult.fullName}</h3>
                    <span className="text-xs text-purple-400 font-medium">({generatedResult.targetRole})</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                    <span>ATS Optimization Score: <strong className="text-emerald-400 font-bold">{generatedResult.atsScore}/100</strong></span>
                    {generatedResult.github && (
                      <span className="text-indigo-400 flex items-center gap-1">
                        <Globe className="h-3 w-3" /> GitHub Linked
                      </span>
                    )}
                    {generatedResult.linkedin && (
                      <span className="text-blue-400 flex items-center gap-1">
                        <Globe className="h-3 w-3" /> LinkedIn Linked
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setGeneratedResult(null)}
                  className="rounded-xl border border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
                >
                  Edit Inputs
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-md shadow-emerald-600/20"
                >
                  {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  <span>Download ATS PDF</span>
                </button>
              </div>
            </div>

            {/* Generated Resume Content Preview */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 flex flex-col gap-4 text-xs">
              <div>
                <h4 className="font-semibold text-slate-200 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-blue-400" />
                  Professional Summary
                </h4>
                <p className="text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  {generatedResult.summary}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-purple-400" />
                  ATS Core Competencies
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {(generatedResult.skills || []).map((skill: string, i: number) => (
                    <span key={i} className="rounded-md bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 text-purple-300 font-mono">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-emerald-400" />
                  Professional Experience (STAR Formatted)
                </h4>
                <div className="flex flex-col gap-3">
                  {(generatedResult.experience || []).map((exp: any, i: number) => (
                    <div key={i} className="rounded-lg bg-slate-900/60 p-3 border border-slate-800">
                      <div className="flex items-center justify-between text-xs font-semibold text-white mb-1">
                        <span>{exp.title} • <span className="text-slate-400 font-normal">{exp.company}</span></span>
                        <span className="text-slate-500 font-mono text-[11px]">{exp.duration}</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-slate-300">
                        {(exp.highlights || []).map((h: string, j: number) => (
                          <li key={j} className="leading-relaxed">{h}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {generatedResult.projects && generatedResult.projects.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Code2 className="h-3.5 w-3.5 text-indigo-400" />
                    Key Featured Projects
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {generatedResult.projects.map((proj: any, i: number) => (
                      <div key={i} className="rounded-lg bg-slate-900/60 p-3 border border-slate-800 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-xs font-semibold text-white mb-1">
                            <span>{proj.name}</span>
                            {proj.url && (
                              <a
                                href={proj.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-indigo-400 hover:underline"
                              >
                                View Repo ↗
                              </a>
                            )}
                          </div>
                          <p className="text-slate-300 text-[11px] leading-relaxed mb-2">
                            {proj.description}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(proj.technologies || []).map((tech: string, j: number) => (
                            <span
                              key={j}
                              className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300 font-mono"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {generatedResult.education && generatedResult.education.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5 text-amber-400" />
                    Verified Education Credentials
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {generatedResult.education.map((edu: any, i: number) => (
                      <div key={i} className="rounded-lg bg-slate-900/60 p-3 border border-slate-800">
                        <div className="flex items-center justify-between text-xs font-semibold text-white">
                          <span>{edu.degree}</span>
                          <span className="text-slate-500 font-mono text-[11px]">{edu.year}</span>
                        </div>
                        <p className="text-slate-400 text-[11px] mt-0.5">{edu.institution}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {generatedResult.certifications && generatedResult.certifications.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 text-blue-400" />
                    Professional Certifications
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {generatedResult.certifications.map((cert: string, i: number) => (
                      <span
                        key={i}
                        className="rounded-md bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 text-blue-300 font-mono text-[11px]"
                      >
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
