import type { ReactNode } from "react";

import { cn } from "../../../lib/cn";

interface AlertProps {
  variant?: "error" | "success";
  children: ReactNode;
}

export function Alert({ variant = "error", children }: AlertProps) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "rounded-lg border px-3.5 py-2.5 text-sm",
        variant === "error"
          ? "border-danger/20 bg-danger/5 text-danger"
          : "border-live/20 bg-live/5 text-live"
      )}
    >
      {children}
    </div>
  );
}
