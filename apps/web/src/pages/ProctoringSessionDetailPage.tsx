import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { AppLayout } from "../layouts/AppLayout";
import { useAuthStore } from "../features/auth/store";
import {
  ProctoringReportCard,
  useProctoringReport,
  useUpdateProctoringEventStatus,
} from "../features/proctoring";
import { getApiErrorMessage } from "../lib/apiClient";

const ELEVATED_ROLES = ["recruiter", "faculty", "admin", "super_admin"];

export default function ProctoringSessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAuthorized = Boolean(user && ELEVATED_ROLES.includes(user.role));

  const report = useProctoringReport(id ?? "");
  const updateStatus = useUpdateProctoringEventStatus(id ?? "");

  if (!isAuthorized) {
    return (
      <AppLayout>
        <div className="mt-6 rounded-xl border border-dashed border-line px-4 py-10 text-center">
          <p className="text-sm text-ink-soft">
            This view is only available to recruiters, faculty, and admins.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <button
        onClick={() => navigate("/app/proctoring/flagged")}
        className="flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to flagged sessions
      </button>

      {report.isLoading && (
        <p className="mt-6 text-sm text-ink-soft">Loading proctoring report...</p>
      )}

      {report.isError && (
        <p className="mt-6 rounded-lg bg-danger/5 px-3.5 py-2.5 text-sm text-danger">
          {getApiErrorMessage(report.error)}
        </p>
      )}

      {report.isSuccess && !report.data && (
        <p className="mt-6 text-sm text-ink-soft">
          No proctoring data exists for this session.
        </p>
      )}

      {report.data && (
        <div className="mt-6">
          <ProctoringReportCard
            report={report.data}
            canReview
            onAcknowledgeEvent={(eventId) =>
              updateStatus.mutate({ eventId, status: "ACKNOWLEDGED" })
            }
            onDismissEvent={(eventId) =>
              updateStatus.mutate({ eventId, status: "DISMISSED" })
            }
          />
        </div>
      )}
    </AppLayout>
  );
}
