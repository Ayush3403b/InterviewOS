import { useEffect, useRef, useState } from "react";
import {
  MapPin,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
} from "lucide-react";

import { useProctoring } from "../../proctoring/useProctoring";
import { ProctoringBadge } from "../../proctoring/ProctoringBadge";

import {
  useCameraCapture,
  useGeolocation,
  useVoiceTranscript,
} from "../../media-capture";

interface InterviewMediaPanelProps {
  interviewSessionId: string;
  accessToken: string;
  screenShareRequired?: boolean;
  autoStartCamera?: boolean;
  consentGiven?: boolean;
  referenceFrame?: string | null;
}

export function InterviewMediaPanel({
  interviewSessionId,
  accessToken,
  screenShareRequired = false,
  autoStartCamera = false,
  consentGiven,
  referenceFrame,
}: InterviewMediaPanelProps) {
  const {
    videoRef,
    stream,
    active: cameraActive,
    starting: cameraStarting,
    error: cameraError,
    start: startCamera,
    stop: stopCamera,
  } = useCameraCapture();

  const {
    status: locationStatus,
    coords: locationCoords,
    fetchLocation,
  } = useGeolocation();

  const proctoring = useProctoring({
    subjectType: "INTERVIEW",
    subjectId: interviewSessionId,
    accessToken,
    videoRef,
    stream,
    screenShareRequired,
    consentGiven,
    referenceFrame,
  });

  const autoStartAttempted = useRef(false);

  useEffect(() => {
    if (!autoStartCamera || autoStartAttempted.current) {
      return;
    }
    autoStartAttempted.current = true;

    void startCamera().then(() => {
      proctoring.sendSignal({ cameraState: "started" });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStartCamera]);

  const [transcript, setTranscript] = useState("");

  const {
    listening: voiceListening,
    supported: voiceSupported,
    start: startVoice,
    stop: stopVoice,
  } = useVoiceTranscript((snippet, isFinal) => {
    setTranscript(snippet);
    if (isFinal) {
      proctoring.sendSignal({ voiceTranscriptSnippet: snippet });
    }
  });

  const handleToggleCamera = async () => {
    if (cameraActive) {
      stopCamera();
      proctoring.sendSignal({ cameraState: "stopped" });
    } else {
      await startCamera();
      proctoring.sendSignal({ cameraState: "started" });
    }
  };

  const handleToggleVoice = () => {
    if (voiceListening) {
      stopVoice();
      proctoring.sendSignal({ micState: "stopped" });
    } else {
      startVoice();
      proctoring.sendSignal({ micState: "started" });
    }
  };

  const handleFetchLocation = async () => {
    const coords = await fetchLocation();
    if (coords) {
      proctoring.sendSignal({ location: coords });
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-panel p-4 space-y-3.5 shadow-sm">
      {/* Panel Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-live animate-pulse" />
          <h2 className="font-display text-sm font-semibold text-ink">
            Live Media & Proctoring
          </h2>
        </div>
        <ProctoringBadge {...proctoring} />
      </div>

      {/* ── Wide Video Preview ───────────────────────────────── */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-ink border border-line shadow-inner flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
        />

        {/* Top Video HUD Ribbon */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-2.5 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
          <div className="flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-semibold text-white border border-white/15">
            <span className="h-2 w-2 rounded-full bg-live animate-ping inline-block" />
            <span>LIVE AI PROCTORING</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-semibold text-white border border-white/15">
            <span>Trust Score:</span>
            <span
              className={`font-bold ${
                proctoring.trustScore >= 80
                  ? "text-live"
                  : proctoring.trustScore >= 50
                    ? "text-warn"
                    : "text-danger"
              }`}
            >
              {proctoring.trustScore}%
            </span>
          </div>
        </div>

        {/* Bottom Video Telemetry Ribbon */}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-2 bg-gradient-to-t from-black/80 to-transparent text-[10px] text-white/90 pointer-events-none">
          <div className="flex items-center gap-1.5 font-medium">
            <span
              className={`h-2 w-2 rounded-full ${
                cameraActive ? "bg-live shadow-sm" : "bg-danger"
              }`}
            />
            <span>{cameraActive ? "Vision Analysis Active" : "Camera Offline"}</span>
          </div>

          {proctoring.latestWarning && proctoring.latestWarning.length > 0 && (
            <span className="text-warn font-semibold animate-pulse truncate max-w-[220px]">
              ⚠️ {proctoring.latestWarning[0].message || proctoring.latestWarning[0].type}
            </span>
          )}
        </div>
      </div>

      {/* ── Control Buttons (Placed directly below live video) ─ */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={handleToggleCamera}
          disabled={cameraStarting}
          className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold shadow-sm transition active:scale-[0.98] disabled:opacity-60 ${
            cameraActive
              ? "bg-signal text-white hover:bg-signal-strong"
              : "bg-surface border border-line text-ink hover:bg-panel hover:text-signal"
          }`}
        >
          {cameraActive ? (
            <VideoOff className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <Video className="h-3.5 w-3.5 shrink-0" />
          )}
          <span>{cameraActive ? "Stop Cam" : "Start Cam"}</span>
        </button>

        <button
          type="button"
          onClick={handleToggleVoice}
          disabled={!voiceSupported}
          className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold shadow-sm transition active:scale-[0.98] disabled:opacity-60 ${
            voiceListening
              ? "bg-live text-white hover:opacity-90"
              : "bg-surface border border-line text-ink hover:bg-panel hover:text-live"
          }`}
        >
          {voiceListening ? (
            <MicOff className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <Mic className="h-3.5 w-3.5 shrink-0" />
          )}
          <span>{voiceListening ? "Stop Voice" : "Voice Capture"}</span>
        </button>

        <button
          type="button"
          onClick={handleFetchLocation}
          disabled={locationStatus === "fetching"}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink shadow-sm hover:bg-panel hover:border-signal/40 transition active:scale-[0.98] disabled:opacity-60"
        >
          <MapPin className="h-3.5 w-3.5 text-signal shrink-0" />
          <span>
            {locationStatus === "fetching" ? "Locating..." : "Location"}
          </span>
        </button>
      </div>

      {/* ── Device & Telemetry Status Card ───────────────────── */}
      <div className="rounded-xl border border-line bg-surface/60 p-3 space-y-1.5 text-xs text-ink-soft">
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="flex items-center justify-between rounded-lg bg-panel p-2 border border-line/60">
            <span className="font-medium text-ink">Camera:</span>
            <span
              className={`font-semibold ${
                cameraActive ? "text-live" : "text-danger"
              }`}
            >
              {cameraActive ? "Active" : "Off"}
              {cameraError && " (Error)"}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-panel p-2 border border-line/60">
            <span className="font-medium text-ink">Microphone:</span>
            <span
              className={`font-semibold ${
                voiceListening ? "text-live" : "text-ink-soft"
              }`}
            >
              {voiceListening ? "Listening" : "Off"}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-panel p-2 border border-line/60 text-[11px]">
          <span className="font-medium text-ink">Geo Location:</span>
          <span className="text-ink font-mono text-[10px]">
            {locationStatus === "resolved" && locationCoords
              ? `${locationCoords.latitude.toFixed(4)}, ${locationCoords.longitude.toFixed(4)}`
              : locationStatus === "denied"
                ? "Permission denied"
                : locationStatus === "fetching"
                  ? "Fetching..."
                  : "Not fetched"}
          </span>
        </div>

        {/* Live speech transcript snippet */}
        <div className="rounded-lg bg-panel p-2 border border-line/60 text-[11px]">
          <div className="flex items-center gap-1 font-medium text-ink mb-0.5">
            <Volume2 className="h-3 w-3 text-signal" />
            <span>Latest Voice Transcript:</span>
          </div>
          <p className="italic text-ink-soft/90 break-words font-sans text-[11px]">
            {transcript ? `"${transcript}"` : "No spoken input detected yet."}
          </p>
        </div>
      </div>
    </div>
  );
}
