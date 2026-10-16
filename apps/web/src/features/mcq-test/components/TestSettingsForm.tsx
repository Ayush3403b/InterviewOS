import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  TEST_SETTINGS_DEFAULTS,
  testSettingsSchema,
  type TestSettingsFormValues,
} from "../schemas";

interface TestSettingsFormProps {
  initialValues?: Partial<TestSettingsFormValues>;
  submitLabel: string;
  submitting: boolean;
  /** Short form for the "new test" modal: title, duration, pass mark only. */
  compact?: boolean;
  onSubmit: (values: TestSettingsFormValues) => void;
  onCancel?: () => void;
}

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-signal";

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs text-danger">{message}</p> : null;
}

/** Test settings, shared by the "new test" modal and the draft editor. */
export function TestSettingsForm({
  initialValues,
  submitLabel,
  submitting,
  compact = false,
  onSubmit,
  onCancel,
}: TestSettingsFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<TestSettingsFormValues>({
    resolver: zodResolver(testSettingsSchema),
    defaultValues: { ...TEST_SETTINGS_DEFAULTS, ...initialValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label className="text-sm font-medium text-ink-soft">Title</label>
        <input
          {...register("title")}
          className={inputClass}
          placeholder="e.g. Frontend fundamentals screening"
        />
        <FieldError message={errors.title?.message} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-ink-soft">Time limit (minutes)</label>
          <input
            type="number"
            min={1}
            max={300}
            {...register("durationMinutes", { valueAsNumber: true })}
            className={inputClass}
          />
          <FieldError message={errors.durationMinutes?.message} />
        </div>
        <div>
          <label className="text-sm font-medium text-ink-soft">Pass mark (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            {...register("passPercentage", { valueAsNumber: true })}
            className={inputClass}
          />
          <FieldError message={errors.passPercentage?.message} />
        </div>
      </div>

      {!compact && (
        <>
          <div>
            <label className="text-sm font-medium text-ink-soft">
              Description <span className="font-normal">(for you - optional)</span>
            </label>
            <textarea {...register("description")} rows={2} className={inputClass} />
            <FieldError message={errors.description?.message} />
          </div>

          <div>
            <label className="text-sm font-medium text-ink-soft">
              Instructions for candidates <span className="font-normal">(optional)</span>
            </label>
            <textarea
              {...register("instructions")}
              rows={3}
              className={inputClass}
              placeholder="e.g. Calculators are not allowed. Each question has exactly one correct answer."
            />
            <FieldError message={errors.instructions?.message} />
          </div>

          <div className="space-y-2 rounded-lg border border-line bg-surface/50 p-3">
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" {...register("shuffleQuestions")} className="accent-signal" />
              Shuffle question order for each candidate
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" {...register("shuffleOptions")} className="accent-signal" />
              Shuffle answer options for each candidate
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                {...register("showScoreToCandidate")}
                className="accent-signal"
              />
              Show candidates their score after submitting
              <span className="text-xs text-ink-soft">(never the answers)</span>
            </label>
          </div>
        </>
      )}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink-soft hover:text-ink"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || (!compact && !isDirty)}
          className="rounded-lg bg-signal px-4 py-2 text-sm font-semibold text-white hover:bg-signal-strong disabled:opacity-50"
        >
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
