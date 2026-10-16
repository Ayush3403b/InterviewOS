import { useProctoringInit } from "../useProctoringInit";
import { ProctoringInitChecklist } from "../ProctoringInitChecklist";

export interface ProctoringGateReadyData {
  consentGiven: boolean;
  referenceFrame: string | null;
}

interface ProctoringGateProps {
  onReady: (data: ProctoringGateReadyData) => void;
  /** Checklist header - defaults to the interview wording. */
  title?: string;
  /** Launch button text - defaults to the interview wording. */
  beginLabel?: string;
}

/**
 * The pre-session readiness check (consent, devices, models,
 * fullscreen). Render it until `onReady` fires, then mount the
 * interview/test room in its place.
 */
export function ProctoringGate({ onReady, title, beginLabel }: ProctoringGateProps) {
  const init = useProctoringInit();

  return (
    <div className="flex w-full min-h-[calc(100vh-8rem)] items-center justify-center py-4 px-2">
      <ProctoringInitChecklist
        {...init}
        title={title}
        beginLabel={beginLabel}
        onReady={() =>
          onReady({
            consentGiven: init.consentGiven,
            referenceFrame: init.referenceFrame,
          })
        }
      />
    </div>
  );
}
