import { useState } from "react";
import { FileText } from "lucide-react";

import { useResumeVersions } from "../useResume";
import { ResumeComparisonView } from "./ResumeComparisonView";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const STATUS_STYLES: Record<string, string> = {
  PROCESSING: "bg-line/60 text-ink-soft",
  PARSED: "bg-live/10 text-live",
  FAILED: "bg-danger/10 text-danger",
};

/**
 * Every resume upload already creates a new document rather than
 * overwriting the last one, so "version history" is just this list -
 * pick any two to see what changed between them.
 */
export function ResumeVersionHistory() {
  const { data, isLoading } = useResumeVersions();
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) {
        return prev.filter((existing) => existing !== id);
      }
      // Only ever compare two at a time - selecting a third drops the
      // oldest selection rather than growing an ambiguous set.
      const next = [...prev, id];
      return next.length > 2 ? next.slice(1) : next;
    });
  }

  if (isLoading) {
    return <p className="text-sm text-ink-soft">Loading version history...</p>;
  }

  if (!data || data.versions.length === 0) {
    return null;
  }

  const [fromId, toId] =
    selected.length === 2
      ? // Compare chronologically: older selection as "from".
        [...selected].sort(
          (a, b) =>
            data.versions.findIndex((v) => v.id === a) -
            data.versions.findIndex((v) => v.id === b)
        ).reverse()
      : [undefined, undefined];

  return (
    <div className="rounded-xl border border-line bg-panel p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink">Version history</p>
        <p className="text-xs text-ink-soft">
          {selected.length === 2
            ? "Comparing 2 versions"
            : `Select ${2 - selected.length} more to compare`}
        </p>
      </div>

      <ul className="mt-3 space-y-1.5">
        {data.versions.map((version) => (
          <li key={version.id}>
            <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-surface">
              <input
                type="checkbox"
                checked={selected.includes(version.id)}
                onChange={() => toggle(version.id)}
                className="h-3.5 w-3.5"
              />
              <FileText className="h-3.5 w-3.5 shrink-0 text-ink-soft" />
              <span className="min-w-0 flex-1 truncate text-sm text-ink">
                {version.fileName}
              </span>
              {version.atsScore !== undefined && (
                <span className="text-xs text-ink-soft">{version.atsScore}/100</span>
              )}
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[version.status] ?? ""}`}
              >
                {version.status}
              </span>
              <span className="text-xs text-ink-soft/70">
                {formatDate(version.createdAt)}
              </span>
            </label>
          </li>
        ))}
      </ul>

      {fromId && toId && (
        <div className="mt-4 border-t border-line pt-4">
          <ResumeComparisonView fromId={fromId} toId={toId} />
        </div>
      )}
    </div>
  );
}
