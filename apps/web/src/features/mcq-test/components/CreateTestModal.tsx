import { X } from "lucide-react";

import { getApiErrorMessage } from "../../../lib/apiClient";

import { useCreateTest } from "../useMcqTests";
import { TestSettingsForm } from "./TestSettingsForm";

interface CreateTestModalProps {
  onClose: () => void;
  onCreated: (testId: string) => void;
}

export function CreateTestModal({ onClose, onCreated }: CreateTestModalProps) {
  const createTest = useCreateTest();

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-ink/40 px-4">
      <div className="w-full max-w-md rounded-xl border border-line bg-panel p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">New MCQ test</h2>
          <button onClick={onClose} className="text-ink-soft hover:text-ink" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-1 text-sm text-ink-soft">
          You'll add questions next - type topics, upload PDFs/photos, or write them yourself.
        </p>

        <div className="mt-5">
          <TestSettingsForm
            compact
            submitLabel="Create test"
            submitting={createTest.isPending}
            onCancel={onClose}
            onSubmit={(values) =>
              createTest.mutate(
                {
                  title: values.title,
                  durationMinutes: values.durationMinutes,
                  passPercentage: values.passPercentage,
                },
                { onSuccess: (test) => onCreated(test.id) }
              )
            }
          />
        </div>

        {createTest.isError && (
          <p className="mt-3 rounded-lg bg-danger/5 px-3 py-2 text-sm text-danger">
            {getApiErrorMessage(createTest.error)}
          </p>
        )}
      </div>
    </div>
  );
}
