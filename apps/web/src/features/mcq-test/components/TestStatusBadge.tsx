import { cn } from "../../../lib/cn";

import { STATUS_LABELS, STATUS_STYLES } from "../labels";
import type { McqTestStatus } from "../types";

export function TestStatusBadge({ status }: { status: McqTestStatus }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-semibold",
        STATUS_STYLES[status]
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
