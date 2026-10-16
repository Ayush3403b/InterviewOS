import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle,
  FileText,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RefreshCw,
  Trash2,
  UploadCloud,
} from "lucide-react";

import { AppLayout } from "../layouts/AppLayout";
import { getApiErrorMessage } from "../lib/apiClient";
import {
  dashboardApi,
  INTERVIEW_LEVEL_LABELS,
  INTERVIEW_TYPE_LABELS,
  useDeleteSession,
} from "../features/dashboard";
import { LiveInterviewRoom, SessionStateScreen } from "../features/interview";
import { ResumeUploader, useMyLatestResume } from "../features/resume";
import {
  CoachingPlanCard,
  useCoachingPlan,
  useGenerateCoachingPlan,
} from "../features/coach";
import { ReportCard, useGenerateReport, useReport } from "../features/report";
import { ProctoringReportCard, useProctoringReport } from "../features/proctoring";
import {
  exitFullscreen,
  isFullscreenActive,
  requestFullscreen,
} from "../features/proctoring/deviceChecks";

export default function InterviewSessionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [pausing, setPausing] = useState(false);
  const [pauseError, setPauseError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(isFullscreenActive());
  const [showReupload, setShowReupload] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const deleteMutation = useDeleteSession();
  const latestResume = useMyLatestResume();

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(isFullscreenActive());
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  const handleToggleFullscreen = async () => {
    if (isFullscreenActive()) {
      await exitFullscreen();
    } else {
      await requestFullscreen();
    }
  };

  const session = useQuery({
    queryKey: ["interview-session", id],
    queryFn: () => dashboardApi.getSessionById(id!),
    enabled: Boolean(id),
  });

  const coachingPlan = useCoachingPlan(id ?? "");
  const generateCoaching = useGenerateCoachingPlan(id ?? "");

  const report = useReport(id ?? "");
  const generateReport = useGenerateReport(id ?? "");

  const proctoringReport = useProctoringReport(id ?? "");

  const handleBegin = async () => {
    if (!id) return;

    setStarting(true);
    setStartError(null);

    try {
      await dashboardApi.startSession(id);
      await session.refetch();
    } catch (error) {
      setStartError(getApiErrorMessage(error));
    } finally {
      setStarting(false);
    }
  };

  const handlePause = async () => {
    if (!id) return;

    setPausing(true);
    setPauseError(null);

    // Automatically exit fullscreen on pause
    if (isFullscreenActive()) {
      await exitFullscreen();
    }

    try {
      await dashboardApi.pauseSession(id);
      await session.refetch();
    } catch (error) {
      setPauseError(getApiErrorMessage(error));
    } finally {
      setPausing(false);
    }
  };

  // When in progress, render a full-viewport split layout (no card wrapper)
  if (session.data?.status === "IN_PROGRESS") {
    return (
      <AppLayout noPadding>
        {/* Slim top bar: back link + session meta + pause */}
        <div className="flex items-center justify-between border-b border-line bg-panel px-5 py-2.5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/app")}
              className="flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <span className="text-sm font-semibold text-ink truncate max-w-[320px]">
              {session.data.title}
            </span>
            <span className="hidden sm:inline text-xs text-ink-soft">
              {INTERVIEW_TYPE_LABELS[session.data.type]} ·{" "}
              {INTERVIEW_LEVEL_LABELS[session.data.level]} ·{" "}
              {session.data.maxQuestions} Qs
            </span>
          </div>

          <div className="flex items-center gap-2">
            {pauseError && (
              <span className="text-xs text-danger">{pauseError}</span>
            )}
            <button
              type="button"
              onClick={() => void handleToggleFullscreen()}
              className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink transition hover:border-signal/40 hover:text-signal shadow-sm"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5 text-signal" />
              )}
              <span>{isFullscreen ? "Exit Fullscreen" : "Go Fullscreen"}</span>
            </button>

            <button
              id="pause-interview-btn"
              onClick={() => void handlePause()}
              disabled={pausing}
              className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink transition hover:border-amber-400 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pausing ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-line border-t-ink" />
              ) : (
                <Pause className="h-3.5 w-3.5" />
              )}
              {pausing ? "Pausing..." : "Pause"}
            </button>
          </div>
        </div>

        {/* Full-viewport split room — fills remaining height, scrollable for gate */}
        <div className="flex-1 overflow-y-auto px-4 pt-3 pb-3">
          <LiveInterviewRoom
            session={session.data}
            onCompleted={() => session.refetch()}
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <button
        onClick={() => navigate("/app")}
        className="flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </button>

      {session.isLoading && (
        <p className="mt-6 text-sm text-ink-soft">Loading session...</p>
      )}

      {session.isError && (
        <p className="mt-6 rounded-lg bg-danger/5 px-3.5 py-2.5 text-sm text-danger">
          {getApiErrorMessage(session.error)}
        </p>
      )}

      {session.data && (
        <div className="mt-6 rounded-2xl border border-line bg-panel p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-ink">
                {session.data.title}
              </h1>
              <p className="mt-1 text-sm text-ink-soft">
                {INTERVIEW_TYPE_LABELS[session.data.type]} ·{" "}
                {INTERVIEW_LEVEL_LABELS[session.data.level]} ·{" "}
                {session.data.maxQuestions} questions
              </p>
            </div>

            <div className="flex items-center gap-2">
              {showDeleteConfirm ? (
                <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/5 p-1.5 animate-in fade-in">
                  <span className="text-xs font-semibold text-danger pl-1.5">
                    Delete interview?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (id) {
                        deleteMutation.mutate(id, {
                          onSuccess: () => navigate("/app", { replace: true }),
                        });
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="rounded-lg bg-danger px-3 py-1 text-xs font-bold text-white shadow-sm hover:bg-danger/90 transition disabled:opacity-50"
                  >
                    {deleteMutation.isPending ? "Deleting..." : "Confirm"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="rounded-lg border border-line bg-panel px-2.5 py-1 text-xs font-medium text-ink-soft hover:text-ink transition"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-panel px-3.5 py-2 text-xs font-semibold text-ink-soft hover:border-danger/40 hover:text-danger hover:bg-danger/5 transition shadow-sm"
                  title="Permanently delete this interview session"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Interview</span>
                </button>
              )}
            </div>
          </div>

          {startError && (
            <p className="mt-4 rounded-lg bg-danger/5 px-3.5 py-2.5 text-sm text-danger">
              {startError}
            </p>
          )}

          {/* ── CREATED ─────────────────────────────────────────────────── */}
          {session.data.status === "CREATED" && (
            <>
              {latestResume.isLoading ? (
                <p className="mt-6 text-sm text-ink-soft animate-pulse">
                  Checking your profile resume...
                </p>
              ) : latestResume.data ? (
                /* Already uploaded resume exists on candidate profile */
                <div className="mt-6 rounded-2xl border border-line bg-surface/60 p-5 space-y-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-signal/10 text-signal">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm text-ink">
                            {latestResume.data.fileName}
                          </p>
                          <span className="rounded-full bg-live/15 px-2.5 py-0.5 text-[11px] font-bold text-live">
                            ✓ Linked Profile Resume
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-ink-soft">
                          ATS Match: <strong>{latestResume.data.atsScore}/100</strong> · {latestResume.data.extractedSkills.length} skills indexed
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowReupload((prev) => !prev)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-panel px-3.5 py-2 text-xs font-semibold text-ink hover:border-signal/40 hover:text-signal shadow-sm transition active:scale-95 shrink-0"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      {showReupload ? "Keep Current Resume" : "Update / Re-upload Resume"}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-live bg-live/10 border border-live/20 p-2.5 rounded-xl font-medium">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <span>
                      Your resume is automatically linked! AI questions will be customized according to your verified skills and background.
                    </span>
                  </div>

                  {showReupload && (
                    <div className="pt-3 border-t border-line/60 space-y-2">
                      <p className="text-xs font-semibold text-ink">
                        Upload a new or updated version (PDF or DOCX):
                      </p>
                      <ResumeUploader
                        interviewSessionId={id}
                        onUploaded={() => {
                          setShowReupload(false);
                          latestResume.refetch();
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                /* No resume uploaded yet - One-time upload prompt */
                <div className="mt-6 rounded-2xl border border-dashed border-line bg-surface/30 p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-signal/10 text-signal">
                      <UploadCloud className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-ink">
                          One-Time Resume Setup (Optional)
                        </p>
                        <span className="rounded-full bg-signal/10 px-2 py-0.5 text-[10px] font-semibold text-signal">
                          1-Time Upload
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-ink-soft leading-relaxed">
                        Upload your resume once and it will automatically be saved to your profile and attached to all future interviews. You can edit or re-upload an updated version anytime.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <ResumeUploader
                      interviewSessionId={id}
                      onUploaded={() => latestResume.refetch()}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleBegin}
                disabled={starting}
                className="mt-6 flex items-center gap-2 rounded-xl bg-signal px-5 py-3 text-sm font-bold text-white shadow-md shadow-signal/25 transition hover:bg-signal-strong disabled:cursor-not-allowed disabled:opacity-60 active:scale-95"
              >
                <Play className="h-4 w-4" />
                {starting ? "Starting..." : "Begin interview"}
              </button>
            </>
          )}

          {/* ── PAUSED ───────────────────────────────────────────────────── */}
          {session.data.status === "PAUSED" && (
            <SessionStateScreen
              sessionId={session.data.id}
              status="PAUSED"
              onAction={() => session.refetch()}
            />
          )}

          {/* ── EXPIRED ──────────────────────────────────────────────────── */}
          {session.data.status === "EXPIRED" && (
            <SessionStateScreen
              sessionId={session.data.id}
              status="EXPIRED"
            />
          )}

          {/* ── CANCELLED ────────────────────────────────────────────────── */}
          {session.data.status === "CANCELLED" && (
            <SessionStateScreen
              sessionId={session.data.id}
              status="CANCELLED"
            />
          )}

          {/* ── COMPLETED ────────────────────────────────────────────────── */}
          {session.data.status === "COMPLETED" && (
            <>
              <div className="mt-6 rounded-lg border border-line bg-surface px-4 py-5">
                <p className="text-sm text-ink-soft">Final score</p>
                <p className="font-display mt-1 text-2xl font-semibold text-ink">
                  {session.data.score}/100
                </p>
                {session.data.feedback && (
                  <p className="mt-3 text-sm text-ink-soft">
                    {session.data.feedback}
                  </p>
                )}
              </div>

              <div className="mt-4">
                {coachingPlan.isLoading && (
                  <p className="text-sm text-ink-soft">
                    Checking for a coaching plan...
                  </p>
                )}

                {coachingPlan.isSuccess && !coachingPlan.data && (
                  <button
                    onClick={() => generateCoaching.mutate()}
                    disabled={generateCoaching.isPending}
                    className="flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:border-signal/40 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {generateCoaching.isPending
                      ? "Generating your coaching plan..."
                      : "Get personalized coaching"}
                  </button>
                )}

                {generateCoaching.isError && (
                  <p className="mt-2 text-sm text-danger">
                    {getApiErrorMessage(generateCoaching.error)}
                  </p>
                )}

                {(coachingPlan.data || generateCoaching.data) && (
                  <div className="mt-2">
                    <CoachingPlanCard
                      plan={generateCoaching.data ?? coachingPlan.data!}
                    />
                  </div>
                )}
              </div>

              <div className="mt-4">
                {report.isLoading && (
                  <p className="text-sm text-ink-soft">
                    Checking for a report...
                  </p>
                )}

                {report.isSuccess && !report.data && (
                  <button
                    onClick={() => generateReport.mutate()}
                    disabled={generateReport.isPending}
                    className="flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:border-signal/40 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {generateReport.isPending
                      ? "Generating your report..."
                      : "Generate interview report"}
                  </button>
                )}

                {generateReport.isError && (
                  <p className="mt-2 text-sm text-danger">
                    {getApiErrorMessage(generateReport.error)}
                  </p>
                )}

                {(report.data || generateReport.data) && (
                  <div className="mt-2">
                    <ReportCard report={generateReport.data ?? report.data!} />
                  </div>
                )}
              </div>

              {proctoringReport.data && (
                <div className="mt-4">
                  <ProctoringReportCard report={proctoringReport.data} />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </AppLayout>
  );
}

