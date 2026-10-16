import { BarChart3 } from "lucide-react";
import { AppLayout } from "../layouts/AppLayout";
import { AnalyticsDashboard } from "../features/analytics";

export function AnalyticsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-signal" />
            <h1 className="font-display text-2xl font-bold text-ink">
              Performance & Skill Analytics
            </h1>
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            Track score improvements, growth over time, and interview mastery trends across your mock rounds.
          </p>
        </div>

        <AnalyticsDashboard />
      </div>
    </AppLayout>
  );
}
