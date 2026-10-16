import { useState } from "react";
import {
  AlertTriangle,
  Download,
  FileCheck,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { getApiErrorMessage } from "../../../lib/apiClient";
import { useExportResumePdf } from "../useResumeWriter";
import type { ExportResumeDto } from "../types";

interface ResumeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<ExportResumeDto>;
}

export function ResumeExportModal({
  isOpen,
  onClose,
  initialData = {},
}: ResumeExportModalProps) {
  const [formData, setFormData] = useState<ExportResumeDto>({
    fullName: initialData.fullName || "",
    title: initialData.title || "",
    email: initialData.email || "",
    phone: initialData.phone || "",
    location: initialData.location || "",
    linkedin: initialData.linkedin || "",
    github: initialData.github || "",
    website: initialData.website || "",
    summary: initialData.summary || "",
    skills: initialData.skills || [],
    experience: initialData.experience || [
      {
        title: "Software Engineer",
        company: "Tech Corp",
        duration: "2021 - Present",
        location: "Remote",
        bullets: [
          "Developed core microservices in Node.js and TypeScript, handling over 10k daily active users.",
          "Collaborated with cross-functional teams to design REST and GraphQL APIs.",
        ],
      },
    ],
    education: initialData.education || [
      {
        degree: "B.S. in Computer Science",
        institution: "University",
        year: "2021",
      },
    ],
    projects: initialData.projects || [],
    certifications: initialData.certifications || [],
  });

  const [skillsInput, setSkillsInput] = useState(
    (initialData.skills || []).join(", ")
  );

  const exportPdf = useExportResumePdf();

  if (!isOpen) return null;

  const handleSkillsChange = (val: string) => {
    setSkillsInput(val);
    const parsed = val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    setFormData((prev) => ({ ...prev, skills: parsed }));
  };

  const handleAddExperience = () => {
    setFormData((prev) => ({
      ...prev,
      experience: [
        ...(prev.experience || []),
        {
          title: "",
          company: "",
          duration: "",
          location: "",
          bullets: [""],
        },
      ],
    }));
  };

  const handleRemoveExperience = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience?.filter((_, i) => i !== idx),
    }));
  };

  const handleUpdateExperience = (
    idx: number,
    field: string,
    value: string | string[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience?.map((exp, i) =>
        i === idx ? { ...exp, [field]: value } : exp
      ),
    }));
  };

  const handleUpdateBullet = (
    expIdx: number,
    bulletIdx: number,
    val: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience?.map((exp, i) => {
        if (i !== expIdx) return exp;
        const newBullets = [...exp.bullets];
        newBullets[bulletIdx] = val;
        return { ...exp, bullets: newBullets };
      }),
    }));
  };

  const handleAddBullet = (expIdx: number) => {
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience?.map((exp, i) =>
        i === expIdx ? { ...exp, bullets: [...exp.bullets, ""] } : exp
      ),
    }));
  };

  const handleRemoveBullet = (expIdx: number, bulletIdx: number) => {
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience?.map((exp, i) =>
        i === expIdx
          ? {
              ...exp,
              bullets: exp.bullets.filter((_, b) => b !== bulletIdx),
            }
          : exp
      ),
    }));
  };

  const handleDownload = () => {
    if (!formData.fullName.trim()) return;
    exportPdf.mutate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-line bg-panel shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-signal" />
            <div>
              <h2 className="text-base font-semibold text-ink">
                Export ATS-Optimized PDF Resume
              </h2>
              <p className="text-xs text-ink-soft">
                Clean single-column typography parsed perfectly by all ATS systems.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-soft hover:bg-surface hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {/* Personal Info */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-ink">
                Full Name <span className="text-danger">*</span>
              </label>
              <input
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                placeholder="e.g. Alex Mercer"
                className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-signal/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink">
                Professional Title
              </label>
              <input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g. Senior Full Stack Engineer"
                className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-signal/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink">Email</label>
              <input
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="alex@example.com"
                className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-signal/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink">Phone</label>
              <input
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+1 (555) 019-2834"
                className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-signal/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink">Location</label>
              <input
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="San Francisco, CA (or Remote)"
                className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-signal/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink">LinkedIn Profile (optional)</label>
              <input
                value={formData.linkedin}
                onChange={(e) =>
                  setFormData({ ...formData, linkedin: e.target.value })
                }
                placeholder="https://linkedin.com/in/username"
                className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-signal/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink">GitHub Profile (optional)</label>
              <input
                value={formData.github}
                onChange={(e) =>
                  setFormData({ ...formData, github: e.target.value })
                }
                placeholder="https://github.com/username"
                className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-signal/30"
              />
            </div>
          </div>

          {/* Professional Summary */}
          <div>
            <label className="text-xs font-medium text-ink">
              Professional Summary
            </label>
            <textarea
              value={formData.summary}
              onChange={(e) =>
                setFormData({ ...formData, summary: e.target.value })
              }
              rows={3}
              placeholder="Concise 2-3 sentence overview highlighting core competencies and major career impacts."
              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-signal/30"
            />
          </div>

          {/* Core Skills */}
          <div>
            <label className="text-xs font-medium text-ink">
              Skills (comma separated)
            </label>
            <input
              value={skillsInput}
              onChange={(e) => handleSkillsChange(e.target.value)}
              placeholder="TypeScript, React, Node.js, Docker, AWS, PostgreSQL, REST"
              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-signal/30"
            />
          </div>

          {/* Experience List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-ink">
                Work Experience
              </label>
              <button
                type="button"
                onClick={handleAddExperience}
                className="inline-flex items-center gap-1 text-xs text-signal hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Position
              </button>
            </div>

            {formData.experience?.map((exp, expIdx) => (
              <div
                key={expIdx}
                className="rounded-xl border border-line bg-surface/50 p-3.5 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-ink-soft">
                    Position #{expIdx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveExperience(expIdx)}
                    className="text-danger hover:opacity-80"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <input
                    value={exp.title}
                    onChange={(e) =>
                      handleUpdateExperience(expIdx, "title", e.target.value)
                    }
                    placeholder="Role / Title"
                    className="rounded-lg border border-line bg-surface px-2.5 py-1 text-xs text-ink"
                  />
                  <input
                    value={exp.company}
                    onChange={(e) =>
                      handleUpdateExperience(expIdx, "company", e.target.value)
                    }
                    placeholder="Company Name"
                    className="rounded-lg border border-line bg-surface px-2.5 py-1 text-xs text-ink"
                  />
                  <input
                    value={exp.duration}
                    onChange={(e) =>
                      handleUpdateExperience(expIdx, "duration", e.target.value)
                    }
                    placeholder="2022 - Present"
                    className="rounded-lg border border-line bg-surface px-2.5 py-1 text-xs text-ink"
                  />
                </div>

                {/* Bullets */}
                <div className="space-y-1.5 pl-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-ink-soft">
                      Achievement Bullets
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddBullet(expIdx)}
                      className="text-[11px] text-signal hover:underline"
                    >
                      + Add bullet
                    </button>
                  </div>
                  {exp.bullets.map((b, bIdx) => (
                    <div key={bIdx} className="flex items-center gap-1.5">
                      <input
                        value={b}
                        onChange={(e) =>
                          handleUpdateBullet(expIdx, bIdx, e.target.value)
                        }
                        placeholder="• Spearheaded..."
                        className="flex-1 rounded-md border border-line bg-surface px-2.5 py-1 text-xs text-ink"
                      />
                      {exp.bullets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveBullet(expIdx, bIdx)}
                          className="text-ink-soft hover:text-danger"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-line px-6 py-4">
          {exportPdf.isError ? (
            <p className="flex items-center gap-1.5 text-xs text-danger">
              <AlertTriangle className="h-3.5 w-3.5" />
              {getApiErrorMessage(exportPdf.error)}
            </p>
          ) : (
            <span className="text-xs text-ink-soft">
              Ready to generate high-resolution ATS PDF
            </span>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-line px-4 py-2 text-xs font-medium text-ink hover:bg-surface"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!formData.fullName.trim() || exportPdf.isPending}
              onClick={handleDownload}
              className="inline-flex items-center gap-2 rounded-lg bg-signal px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-signal-strong disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              {exportPdf.isPending ? "Generating PDF..." : "Download ATS PDF"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
