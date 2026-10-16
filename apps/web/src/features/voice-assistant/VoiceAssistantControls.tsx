import { Volume2, VolumeX, Mic, MicOff, Play, Pause, Sparkles } from "lucide-react";
import type { UseVoiceAssistantResult } from "./useVoiceAssistant";

interface VoiceAssistantControlsProps extends UseVoiceAssistantResult {
  questionText?: string;
  onAppendSpeechToAnswer?: (text: string) => void;
}

export function VoiceAssistantControls({
  isSpeaking,
  isPaused,
  ttsSupported,
  speakQuestion,
  stopSpeaking,
  togglePauseSpeaking,
  autoSpeak,
  setAutoSpeak,
  isListening,
  sttSupported,
  interimTranscript,
  toggleListening,
  questionText,
}: VoiceAssistantControlsProps) {
  return (
    <div className="rounded-xl border border-line bg-surface/80 p-3.5 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: AI Voice Status / Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg bg-panel px-2.5 py-1.5 border border-line text-xs">
            <Sparkles className="h-3.5 w-3.5 text-signal animate-pulse" />
            <span className="font-medium text-ink">AI Voice Assistant</span>
          </div>

          {ttsSupported && (
            <div className="flex items-center gap-1">
              {isSpeaking ? (
                <>
                  <button
                    type="button"
                    onClick={togglePauseSpeaking}
                    className="flex items-center gap-1 rounded-md bg-signal/10 text-signal border border-signal/30 px-2 py-1 text-xs font-medium hover:bg-signal/20 transition"
                    title={isPaused ? "Resume AI Voice" : "Pause AI Voice"}
                  >
                    {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                    {isPaused ? "Resume" : "Speaking..."}
                  </button>
                  <button
                    type="button"
                    onClick={stopSpeaking}
                    className="p-1 rounded-md text-ink-soft hover:text-danger hover:bg-danger/10 transition"
                    title="Stop Speaking"
                  >
                    <VolumeX className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => questionText && speakQuestion(questionText)}
                  disabled={!questionText}
                  className="flex items-center gap-1 rounded-md bg-panel border border-line text-ink px-2.5 py-1 text-xs font-medium hover:bg-surface transition disabled:opacity-50"
                >
                  <Volume2 className="h-3 w-3 text-signal" />
                  Read aloud
                </button>
              )}

              <button
                type="button"
                onClick={() => setAutoSpeak(!autoSpeak)}
                className={`ml-1 text-[11px] px-2 py-0.5 rounded-full border transition ${
                  autoSpeak
                    ? "bg-live/10 border-live/30 text-live font-medium"
                    : "bg-panel border-line text-ink-soft"
                }`}
                title="Toggle automatically reading questions aloud when they load"
              >
                Auto-read: {autoSpeak ? "ON" : "OFF"}
              </button>
            </div>
          )}
        </div>

        {/* Right: Candidate Voice Dictation Mode */}
        {sttSupported && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleListening}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition shadow-sm ${
                isListening
                  ? "bg-danger text-white animate-pulse"
                  : "bg-panel text-ink border border-line hover:border-signal/40 hover:text-signal"
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="h-3.5 w-3.5" />
                  <span>Listening... (Click to stop)</span>
                </>
              ) : (
                <>
                  <Mic className="h-3.5 w-3.5 text-signal" />
                  <span>Dictate Answer</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Speaking Animation Waveform */}
      {isSpeaking && !isPaused && (
        <div className="mt-2.5 flex items-center gap-1.5 pt-2 border-t border-line/60">
          <div className="flex items-end gap-0.5 h-3">
            <span className="w-1 bg-signal rounded-full animate-bounce [animation-delay:-0.3s] h-full" />
            <span className="w-1 bg-signal rounded-full animate-bounce [animation-delay:-0.15s] h-3/4" />
            <span className="w-1 bg-signal rounded-full animate-bounce [animation-delay:-0.45s] h-1/2" />
            <span className="w-1 bg-signal rounded-full animate-bounce h-full" />
          </div>
          <span className="text-xs text-signal font-medium">Interviewer is speaking the question aloud...</span>
        </div>
      )}

      {/* Live Interim Candidate Speech Output */}
      {isListening && interimTranscript && (
        <div className="mt-2.5 pt-2 border-t border-line/60 text-xs text-ink-soft">
          <span className="font-medium text-ink">Transcribing: </span>
          <span className="italic text-signal font-sans">"{interimTranscript}"</span>
        </div>
      )}
    </div>
  );
}
