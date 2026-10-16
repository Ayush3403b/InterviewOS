import { useProctoringInit } from "../../proctoring/useProctoringInit";
import { ProctoringInitChecklist } from "../../proctoring/ProctoringInitChecklist";

export interface ProctoringGateReadyData {
  consentGiven: boolean;
  referenceFrame: string | null;
}

interface ProctoringGateProps {
  onReady: (data: ProctoringGateReadyData) => void;
}

export function ProctoringGate({ onReady }: ProctoringGateProps) {
  const init = useProctoringInit();

  return (
    <div className="flex w-full min-h-[calc(100vh-8rem)] items-center justify-center py-4 px-2">
      <ProctoringInitChecklist
        {...init}
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
