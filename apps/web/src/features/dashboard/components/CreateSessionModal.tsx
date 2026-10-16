import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";

import { getApiErrorMessage } from "../../../lib/apiClient";

import {
  createSessionSchema,
  INTERVIEW_LEVELS,
  INTERVIEW_LEVEL_LABELS,
  INTERVIEW_TYPES,
  INTERVIEW_TYPE_LABELS,
  type CreateSessionFormValues,
} from "../schemas";
import { useCreateSession } from "../useDashboard";
import type { SectionAllocation } from "../types";

interface CreateSessionModalProps {
  onClose: () => void;
  onCreated: (sessionId: string) => void;
}

const SECTION_LABELS: Record<string, string> = {
  intro: "Intro",
  behavioral: "Behavioral",
  technical: "Technical",
  wrapUp: "Wrap-up",
};

const SECTION_KEYS = ["intro", "behavioral", "technical", "wrapUp"] as const;

function SectionSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-medium text-ink-soft">{label}</span>
        <span className="tabular-nums font-semibold text-signal w-4 text-right">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-signal h-1.5 rounded-full cursor-pointer"
      />
    </div>
  );
}

export function CreateSessionModal({
  onClose,
  onCreated,
}: CreateSessionModalProps) {
  const createSession = useCreateSession();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<CreateSessionFormValues>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: {
      type: "TECHNICAL",
      level: "INTERMEDIATE",
      sectionPlanEnabled: false,
      sectionPlan: { intro: 1, behavioral: 3, technical: 4, wrapUp: 1 },
    },
  });

  // useWatch rather than useForm's watch: it subscribes properly, so the
  // React Compiler can still optimise this component.
  const sectionPlanEnabled = useWatch({ control, name: "sectionPlanEnabled" });
  const sectionPlan = useWatch({ control, name: "sectionPlan" });
  const sectionTotal = sectionPlan
    ? Object.values(sectionPlan).reduce((s, v) => s + (v || 0), 0)
    : 0;

  const onSubmit = handleSubmit((values) => {
    // Normalise: treat empty strings as undefined so the API doesn't see them.
    const payload: Parameters<typeof createSession.mutate>[0] = {
      title: values.title,
      type: values.type,
      level: values.level,
      targetCompany: values.targetCompany?.trim() || undefined,
      targetRole: values.targetRole?.trim() || undefined,
    };

    if (values.sectionPlanEnabled && values.sectionPlan && sectionTotal > 0) {
      // Convert flat sectionPlan object → SectionAllocation[] for the API.
      const sections: SectionAllocation[] = (
        [
          { name: "intro", maxQuestions: values.sectionPlan.intro },
          { name: "behavioral", maxQuestions: values.sectionPlan.behavioral },
          { name: "technical", maxQuestions: values.sectionPlan.technical },
          { name: "wrap-up", maxQuestions: values.sectionPlan.wrapUp },
        ] satisfies SectionAllocation[]
      ).filter((s) => s.maxQuestions > 0);

      payload.sectionPlan = sections;
      // maxQuestions is ignored by the backend when sectionPlan is provided.
    } else {
      payload.maxQuestions = values.maxQuestions;
    }

    createSession.mutate(payload, {
      onSuccess: (session) => onCreated(session.id),
    });
  });

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-ink/40 px-4">
      <div className="w-full max-w-md rounded-xl border border-line bg-panel p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">
            Start a new interview
          </h2>
          <button
            onClick={onClose}
            className="text-ink-soft hover:text-ink"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
          <div>
            <label className="text-sm font-medium text-ink-soft">Title</label>
            <input
              className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal/20"
              placeholder="e.g. Backend engineer practice round"
              {...register("title")}
            />
            {errors.title && (
              <p className="mt-1.5 text-sm text-danger">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-ink-soft">Type</label>
              <select
                className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal/20"
                {...register("type")}
              >
                {INTERVIEW_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {INTERVIEW_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-ink-soft">Level</label>
              <select
                className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal/20"
                {...register("level")}
              >
                {INTERVIEW_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {INTERVIEW_LEVEL_LABELS[level]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Target company + role — optional, used for template question seeds */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-ink-soft">
                Target company
                <span className="ml-1 text-xs text-ink-soft/60">(optional)</span>
              </label>
              <input
                className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal/20"
                placeholder="e.g. Google"
                {...register("targetCompany")}
              />
              {errors.targetCompany && (
                <p className="mt-1.5 text-sm text-danger">
                  {errors.targetCompany.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-ink-soft">
                Target role
                <span className="ml-1 text-xs text-ink-soft/60">(optional)</span>
              </label>
              <input
                className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal/20"
                placeholder="e.g. Software Engineer"
                {...register("targetRole")}
              />
              {errors.targetRole && (
                <p className="mt-1.5 text-sm text-danger">
                  {errors.targetRole.message}
                </p>
              )}
            </div>
          </div>

          {/* Section plan toggle */}
          <div className="rounded-lg border border-line bg-white/50 p-3.5">
            <label className="flex items-center justify-between cursor-pointer select-none">
              <div>
                <p className="text-sm font-medium text-ink">
                  Section planning
                </p>
                <p className="text-xs text-ink-soft/70 mt-0.5">
                  Allocate questions per section (intro → behavioral → technical → wrap-up)
                </p>
              </div>
              <button
                type="button"
                id="section-plan-toggle"
                role="switch"
                aria-checked={!!sectionPlanEnabled}
                onClick={() =>
                  setValue("sectionPlanEnabled", !sectionPlanEnabled)
                }
                className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${sectionPlanEnabled ? "bg-signal" : "bg-line"
                  }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${sectionPlanEnabled ? "translate-x-4" : "translate-x-1"
                    }`}
                />
              </button>
            </label>

            {sectionPlanEnabled && (
              <div className="mt-4 space-y-3">
                {SECTION_KEYS.map((key) => (
                  <SectionSlider
                    key={key}
                    label={SECTION_LABELS[key]}
                    value={sectionPlan?.[key] ?? 0}
                    onChange={(v) =>
                      setValue(`sectionPlan.${key}`, v, {
                        shouldValidate: true,
                      })
                    }
                  />
                ))}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-line">
                  <span className="text-ink-soft">Total questions</span>
                  <span
                    className={`font-semibold tabular-nums ${sectionTotal === 0 ? "text-danger" : "text-ink"
                      }`}
                  >
                    {sectionTotal}
                  </span>
                </div>
                {sectionTotal === 0 && (
                  <p className="text-xs text-danger">
                    Set at least 1 question across any section.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Flat question count — shown only when section plan is off */}
          {!sectionPlanEnabled && (
            <div>
              <label className="text-sm font-medium text-ink-soft">
                Number of questions (optional)
              </label>
              <input
                type="number"
                min={1}
                max={50}
                className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal/20"
                placeholder="Defaults if left blank"
                {...register("maxQuestions", {
                  setValueAs: (value) =>
                    value === "" ? undefined : Number(value),
                })}
              />
              {errors.maxQuestions && (
                <p className="mt-1.5 text-sm text-danger">
                  {errors.maxQuestions.message}
                </p>
              )}
            </div>
          )}

          {createSession.isError && (
            <p className="rounded-lg bg-danger/5 px-3.5 py-2.5 text-sm text-danger">
              {getApiErrorMessage(createSession.error)}
            </p>
          )}

          <button
            type="submit"
            id="create-session-submit"
            disabled={
              createSession.isPending ||
              (!!sectionPlanEnabled && sectionTotal === 0)
            }
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-signal px-4 py-2.5 text-sm font-medium text-white transition hover:bg-signal-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            {createSession.isPending && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            Create session
          </button>
        </form>
      </div>
    </div>
  );
}
