import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import type { UseProctoringResult } from "./useProctoring";

function trustColor(trustScore: number): string {
  if (trustScore >= 80) return "bg-live text-live";
  if (trustScore >= 60) return "bg-warn text-warn";
  return "bg-danger text-danger";
}

export function ProctoringBadge({
  status,
  trustScore,
  latestWarning,
  connected,
}: UseProctoringResult) {
  const isFlagged = status === "FLAGGED";

  return (
    <div className="inline-flex items-center gap-2.5 rounded-full border border-line bg-panel/90 px-3 py-1.5 text-xs shadow-sm backdrop-blur-sm">
      <div className="flex items-center gap-1.5">
        <span
          className={`h-2 w-2 rounded-full ${
            connected ? trustColor(trustScore).split(" ")[0] : "bg-ink-soft/40 animate-pulse"
          }`}
        />
        <span className="font-semibold text-ink">
          {connected ? `Trust ${trustScore}/100` : "Connecting proctoring..."}
        </span>
      </div>

      {isFlagged ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 font-medium text-danger">
          <ShieldAlert className="h-3 w-3" />
          Flagged
        </span>
      ) : connected ? (
        <span className="inline-flex items-center gap-1 text-[11px] text-live font-medium">
          <ShieldCheck className="h-3 w-3" />
          Active
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-[11px] text-ink-soft">
          <Shield className="h-3 w-3" />
          Offline
        </span>
      )}

      {latestWarning && latestWarning.length > 0 && (
        <span className="max-w-[200px] truncate text-warn font-medium">
          · {latestWarning[0].message}
        </span>
      )}
    </div>
  );
}
