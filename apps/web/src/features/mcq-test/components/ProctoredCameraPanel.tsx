import { useEffect, useEffectEvent } from "react";
import { ShieldAlert, ShieldCheck, VideoOff } from "lucide-react";

import { useCameraCapture } from "../../media-capture";
import { useProctoring } from "../../proctoring/useProctoring";

interface ProctoredCameraPanelProps {
  attemptId: string;
  accessToken: string;
  consentGiven: boolean;
  referenceFrame: string | null;
}

/**
 * The test room's invigilation: camera preview plus the same
 * continuous proctoring the interview room runs. Unlike interviews the
 * candidate can't switch the camera off, and copy/paste/right-click
 * are blocked rather than just reported.
 */
export function ProctoredCameraPanel({
  attemptId,
  accessToken,
  consentGiven,
  referenceFrame,
}: ProctoredCameraPanelProps) {
  const { videoRef, stream, active, starting, error, start, stop } = useCameraCapture();

  const proctoring = useProctoring({
    subjectType: "MCQ_ATTEMPT",
    subjectId: attemptId,
    accessToken,
    videoRef,
    stream,
    consentGiven,
    referenceFrame,
    blockCopyPaste: true,
    blockRightClick: true,
  });

  const startCamera = async () => {
    await start();
    proctoring.sendSignal({ cameraState: "started" });
  };

  const startCameraOnMount = useEffectEvent(() => void startCamera());

  useEffect(() => {
    startCameraOnMount();
    // Release the camera when the test ends (the room unmounts).
    return () => stop();
  }, [stop]);

  return (
    <div className="space-y-2.5 rounded-2xl border border-line bg-panel p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-live animate-pulse" />
          <h2 className="font-display text-sm font-semibold text-ink">Proctoring</h2>
        </div>
        {/* Compact status - trust and the latest warning are shown below. */}
        {proctoring.status === "FLAGGED" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-[11px] font-medium text-danger">
            <ShieldAlert className="h-3 w-3" /> Flagged
          </span>
        ) : proctoring.connected ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-live">
            <ShieldCheck className="h-3 w-3" /> Live
          </span>
        ) : (
          <span className="text-[11px] text-ink-soft animate-pulse">Connecting...</span>
        )}
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-line bg-ink">
        <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />

        {!active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink/90 p-3 text-center text-xs text-white">
            <VideoOff className="h-5 w-5" />
            <span>{starting ? "Starting camera..." : (error ?? "Camera is off")}</span>
            {!starting && (
              <button
                type="button"
                onClick={() => void startCamera()}
                className="rounded-md bg-white/15 px-2.5 py-1 font-semibold hover:bg-white/25"
              >
                Turn camera back on
              </button>
            )}
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-end p-2">
          <span className="rounded-full border border-white/15 bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">
            Trust{" "}
            <span
              className={
                proctoring.trustScore >= 80
                  ? "text-live"
                  : proctoring.trustScore >= 50
                    ? "text-warn"
                    : "text-danger"
              }
            >
              {proctoring.trustScore}%
            </span>
          </span>
        </div>
      </div>

      {proctoring.latestWarning && proctoring.latestWarning.length > 0 && (
        <p className="rounded-lg bg-warn/10 px-2.5 py-1.5 text-[11px] font-medium text-warn">
          ⚠️ {proctoring.latestWarning[0].message || proctoring.latestWarning[0].type}
        </p>
      )}
    </div>
  );
}
