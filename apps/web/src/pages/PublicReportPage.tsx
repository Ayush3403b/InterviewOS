import { useParams, Link } from "react-router-dom";
import { ShieldCheck, Calendar, Briefcase, Award, ArrowLeft } from "lucide-react";

import { usePublicReport } from "../features/report/useReport";
import { ReportCard } from "../features/report/components/ReportCard";

export function PublicReportPage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const { data: report, isLoading, error } = usePublicReport(shareToken || "");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-signal/30 border-t-signal" />
          <p className="text-sm font-medium text-ink-soft">Loading candidate evaluation report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-line bg-panel p-8 text-center shadow-lg space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="font-display text-xl font-bold text-ink">Report Unavailable</h1>
          <p className="text-sm text-ink-soft">
            This shared interview report has either expired, been revoked by the recruiter, or does not exist.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-signal hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to InterviewOS
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(report.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-canvas text-ink py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Public Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-panel p-6 shadow-sm">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-live/10 px-2.5 py-0.5 text-xs font-medium text-live">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified Evaluation Report
              </span>
              <span className="text-xs text-ink-soft">• Public Candidate Brief</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-ink">
              {report.candidateName} — {report.interviewTitle}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-ink-soft">
              <div className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />
                <span>{report.interviewType} ({report.interviewLevel})</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>Evaluated on {formattedDate}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-surface p-3 rounded-xl border border-line">
            <Award className="h-8 w-8 text-signal" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Overall Score</p>
              <p className="text-2xl font-bold text-ink">{report.overallScore}<span className="text-sm font-normal text-ink-soft">/100</span></p>
            </div>
          </div>
        </div>

        {/* Report Card */}
        <ReportCard report={report} />

        {/* Footer */}
        <div className="text-center py-4 text-xs text-ink-soft">
          Generated securely by <span className="font-semibold text-ink">InterviewOS</span> • Confidential Candidate Evaluation
        </div>
      </div>
    </div>
  );
}
