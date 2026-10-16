import { useState } from "react";
import { TrendingUp, Award, Clock, CheckCircle2, BarChart2, Calendar, Target } from "lucide-react";
import { useScoreTrends, useInterviewStats } from "../useAnalytics";
import type { ScoreTrendPoint } from "../api";

export function AnalyticsDashboard() {
  const { data: trends, isLoading: loadingTrends } = useScoreTrends(20);
  const { data: stats, isLoading: loadingStats } = useInterviewStats();
  const [selectedPoint, setSelectedPoint] = useState<ScoreTrendPoint | null>(null);

  if (loadingTrends || loadingStats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-signal border-t-transparent" />
          <p className="text-xs text-ink-soft">Loading analytics telemetry...</p>
        </div>
      </div>
    );
  }

  const validTrends = trends ?? [];
  const averageScore = Math.round(stats?.averageScore ?? 0);
  const totalCompleted = stats?.completedInterviews ?? validTrends.length;
  const totalMinutes = Math.round((stats?.totalDuration ?? 0) / 60);

  // SVG Trend Chart Dimensions
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 30;

  const chartPoints = validTrends.map((t, index) => {
    const x =
      validTrends.length === 1
        ? svgWidth / 2
        : paddingX + (index / (validTrends.length - 1)) * (svgWidth - paddingX * 2);
    const y = svgHeight - paddingY - (t.score / 100) * (svgHeight - paddingY * 2);
    return { ...t, x, y };
  });

  const polylinePoints = chartPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-line bg-panel p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-soft">Average Score</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-signal/10 text-signal">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-ink">{averageScore}</span>
            <span className="text-xs text-ink-soft">/ 100</span>
          </div>
          <p className="mt-1 text-[11px] text-live flex items-center gap-1 font-medium">
            <TrendingUp className="h-3 w-3" /> Across all completed sessions
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-panel p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-soft">Completed Interviews</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-live/10 text-live">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-ink">{totalCompleted}</span>
            <span className="text-xs text-ink-soft">sessions</span>
          </div>
          <p className="mt-1 text-[11px] text-ink-soft">Full AI-evaluated rounds</p>
        </div>

        <div className="rounded-2xl border border-line bg-panel p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-soft">Practice Time</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-ink">{totalMinutes}</span>
            <span className="text-xs text-ink-soft">minutes</span>
          </div>
          <p className="mt-1 text-[11px] text-ink-soft">Dedicated interview runtime</p>
        </div>

        <div className="rounded-2xl border border-line bg-panel p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-soft">Ready Level</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600">
              <Target className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold text-ink">
              {averageScore >= 80 ? "Interview Ready" : averageScore >= 60 ? "Proficient" : "Developing"}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-ink-soft">Candidate proficiency band</p>
        </div>
      </div>

      {/* Score Progression Trend Chart */}
      <div className="rounded-2xl border border-line bg-panel p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-signal" />
              <h2 className="font-display text-base font-semibold text-ink">Score Progression Over Time</h2>
            </div>
            <p className="text-xs text-ink-soft mt-0.5">
              Longitudinal tracking of your score performance across completed mock interviews
            </p>
          </div>

          {selectedPoint && (
            <div className="rounded-lg bg-surface border border-line px-3 py-1.5 text-xs text-ink flex items-center gap-3">
              <span className="font-medium text-signal">{selectedPoint.title}</span>
              <span className="font-bold text-ink">{selectedPoint.score}/100</span>
              <span className="text-ink-soft text-[11px]">{selectedPoint.type}</span>
            </div>
          )}
        </div>

        {validTrends.length === 0 ? (
          <div className="py-12 text-center text-ink-soft text-xs">
            No completed interview sessions yet. Complete your first interview to see score trends!
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full max-h-[260px]">
              {/* Grid Lines */}
              {[25, 50, 75, 100].map((scoreVal) => {
                const y = svgHeight - paddingY - (scoreVal / 100) * (svgHeight - paddingY * 2);
                return (
                  <g key={scoreVal}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={svgWidth - paddingX}
                      y2={y}
                      stroke="currentColor"
                      strokeDasharray="4 4"
                      className="text-line"
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 3}
                      textAnchor="end"
                      fontSize={9}
                      fill="currentColor"
                      className="text-ink-soft"
                    >
                      {scoreVal}
                    </text>
                  </g>
                );
              })}

              {/* Trend Polyline */}
              {chartPoints.length > 1 && (
                <polyline
                  points={polylinePoints}
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data Points */}
              {chartPoints.map((point) => (
                <g key={point._id} className="cursor-pointer" onClick={() => setSelectedPoint(point)}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={selectedPoint?._id === point._id ? 6 : 4}
                    fill={point.score >= 70 ? "#10B981" : point.score >= 50 ? "#3B82F6" : "#EF4444"}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    className="transition-all hover:scale-125"
                  />
                </g>
              ))}
            </svg>
          </div>
        )}
      </div>

      {/* History table */}
      <div className="rounded-2xl border border-line bg-panel overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-line">
          <h3 className="font-display text-sm font-semibold text-ink">Completed Session Log</h3>
        </div>

        <div className="divide-y divide-line">
          {validTrends.slice().reverse().map((item) => (
            <div key={item._id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 text-xs hover:bg-surface/50 transition">
              <div>
                <p className="font-semibold text-ink">{item.title}</p>
                <div className="flex items-center gap-2 text-ink-soft text-[11px] mt-0.5">
                  <span className="rounded bg-line/60 px-1.5 py-0.5 font-medium">{item.type}</span>
                  <span>{item.level}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="font-bold text-sm text-ink">{item.score}</span>
                  <span className="text-ink-soft text-[11px]">/100</span>
                </div>
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    item.score >= 70 ? "bg-live" : item.score >= 50 ? "bg-signal" : "bg-danger"
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
