import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
}

export function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="rounded-xl border border-line bg-panel p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-soft">{label}</p>
        <span className="text-ink-soft/60">{icon}</span>
      </div>
      <p className="font-display mt-2 text-2xl font-semibold text-ink">
        {value}
      </p>
    </div>
  );
}
