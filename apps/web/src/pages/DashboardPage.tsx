import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  ChevronRight,
  Clock,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import { AppLayout } from "../layouts/AppLayout";
import { useAuthStore } from "../features/auth/store";
import {
  CreateSessionModal,
  SessionCard,
  SESSIONS_LIMIT,
  useSessions,
  useStatistics,
} from "../features/dashboard";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const statistics = useStatistics();
  const sessions = useSessions(page);

  const hasNextPage = (sessions.data?.length ?? 0) === SESSIONS_LIMIT;

  return (
    <AppLayout>
      {/* ── Greeting header ───────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="font-display text-2xl font-bold text-ink">
                {getGreeting()}, {user?.firstName ?? "there"} 👋
              </h1>
              <p className="mt-1 text-sm text-ink-soft">
                Ready for your next interview? Let's keep the streak going.
              </p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-4 sm:mt-0 inline-flex items-center gap-2 rounded-xl bg-signal px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-signal/30 transition hover:bg-signal-strong hover:shadow-signal/40 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              New interview
            </button>
          </div>

          {/* ── Stat cards ────────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
            {/* Interviews */}
            <div className="group relative overflow-hidden rounded-2xl border border-line bg-panel p-5 transition hover:border-signal/30 hover:shadow-md">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium uppercase tracking-wider text-ink-soft">
                  Interviews
                </p>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-signal/10">
                  <BookOpen className="h-4 w-4 text-signal" />
                </span>
              </div>
              <p className="font-display text-3xl font-bold text-ink">
                {statistics.isLoading
                  ? <span className="animate-pulse text-ink-soft/30">—</span>
                  : (statistics.data?.totalInterviews ?? 0)}
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                {statistics.data?.completedInterviews ?? 0} completed
              </p>
              <div className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-signal/50 to-transparent" />
            </div>

            {/* Avg Score */}
            <div className="group relative overflow-hidden rounded-2xl border border-line bg-panel p-5 transition hover:border-live/30 hover:shadow-md">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium uppercase tracking-wider text-ink-soft">
                  Avg Score
                </p>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-live/10">
                  <TrendingUp className="h-4 w-4 text-live" />
                </span>
              </div>
              <p className="font-display text-3xl font-bold text-ink">
                {statistics.isLoading
                  ? <span className="animate-pulse text-ink-soft/30">—</span>
                  : statistics.data
                    ? `${statistics.data.averageScore}%`
                    : "—"}
              </p>
              <p className="mt-1 text-xs text-ink-soft">across all sessions</p>
              <div className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-live/50 to-transparent" />
            </div>

            {/* Practice time */}
            <div className="group relative overflow-hidden rounded-2xl border border-line bg-panel p-5 transition hover:border-warn/30 hover:shadow-md">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium uppercase tracking-wider text-ink-soft">
                  Practice
                </p>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-warn/10">
                  <Clock className="h-4 w-4 text-warn" />
                </span>
              </div>
              <p className="font-display text-3xl font-bold text-ink">
                {statistics.isLoading
                  ? <span className="animate-pulse text-ink-soft/30">—</span>
                  : statistics.data
                    ? `${Math.round(statistics.data.totalDuration / 3600)}h`
                    : "—"}
              </p>
              <p className="mt-1 text-xs text-ink-soft">total time practiced</p>
              <div className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-warn/50 to-transparent" />
            </div>
          </div>

          {/* ── Start New Interview CTA card ──────────────────── */}
          <div className="relative mb-8 overflow-hidden rounded-2xl border border-signal/20 bg-gradient-to-br from-signal/[0.07] via-panel to-panel p-6">
            {/* Background decoration */}
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-signal/5 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-signal/5 blur-2xl" />

            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-signal/15">
                  <Sparkles className="h-6 w-6 text-signal" />
                </span>
                <div>
                  <h2 className="font-display text-lg font-bold text-ink">
                    Start New Interview
                  </h2>
                  <p className="mt-0.5 text-sm text-ink-soft">
                    Practice with your AI interviewer — technical, behavioral, or coding.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {["Technical", "Behavioral", "Live Coding", "System Design"].map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-signal/20 bg-signal/5 px-2.5 py-0.5 text-[11px] font-medium text-signal"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setModalOpen(true)}
                className="flex shrink-0 items-center gap-2 rounded-xl bg-signal px-5 py-3 text-sm font-bold text-white shadow-md shadow-signal/25 transition hover:bg-signal-strong hover:shadow-signal/40 active:scale-95"
              >
                <Target className="h-4 w-4" />
                Start Interview
              </button>
            </div>
          </div>

          {/* ── Recent Interviews ──────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-base font-semibold text-ink">
                Recent Interviews
              </h2>
              {sessions.data && sessions.data.length > 0 && (
                <button
                  onClick={() => navigate("/app/interviews")}
                  className="flex items-center gap-1 text-xs font-medium text-signal hover:text-signal-strong"
                >
                  View all
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {sessions.isLoading && (
              <div className="space-y-2.5">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded-xl border border-line bg-panel"
                  />
                ))}
              </div>
            )}

            {sessions.isSuccess && sessions.data.length === 0 && page === 1 && (
              <div className="rounded-2xl border border-dashed border-line bg-panel/50 px-6 py-12 text-center">
                <BookOpen className="mx-auto mb-3 h-8 w-8 text-ink-soft/40" />
                <p className="text-sm font-medium text-ink-soft">
                  No interviews yet
                </p>
                <p className="mt-1 text-xs text-ink-soft/70">
                  Start your first session to see results here.
                </p>
                <button
                  onClick={() => setModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-signal/10 px-4 py-2 text-sm font-medium text-signal transition hover:bg-signal/15"
                >
                  <Plus className="h-4 w-4" />
                  Start your first interview
                </button>
              </div>
            )}

            {sessions.isSuccess && sessions.data.length > 0 && (
              <div className="space-y-2.5">
                {sessions.data.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            )}

            {(page > 1 || hasNextPage) && (
              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink-soft transition hover:border-signal/30 hover:text-ink disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-xs text-ink-soft">Page {page}</span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!hasNextPage}
                  className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-signal transition hover:border-signal/40 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>

      {modalOpen && (
        <CreateSessionModal
          onClose={() => setModalOpen(false)}
          onCreated={(sessionId) => {
            setModalOpen(false);
            navigate(`/app/interviews/${sessionId}`);
          }}
        />
      )}
    </AppLayout>
  );
}
