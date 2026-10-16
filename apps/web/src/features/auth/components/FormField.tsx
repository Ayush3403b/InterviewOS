import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "../../../lib/cn";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, id, className, ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <div className="space-y-1.5">
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-ink-soft"
        >
          {label}
        </label>

        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded-lg border bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none transition",
            "border-line placeholder:text-slate-400",
            "focus:border-signal focus:ring-2 focus:ring-signal/20",
            error && "border-danger focus:border-danger focus:ring-danger/15",
            className
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />

        {error && (
          <p id={`${inputId}-error`} className="text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";
