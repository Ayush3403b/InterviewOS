import { useState, useEffect } from "react";
import { Mic, MicOff, Volume2, VolumeX, X, Radio, Sparkles, MessageSquare } from "lucide-react";
import { VoiceAssistantVisualizer } from "./VoiceAssistantVisualizer";
import { useVoiceAssistant } from "./useVoiceAssistant";

interface VoiceInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentQuestion?: string;
  onAnswerSubmit?: (answer: string) => void;
}

export function VoiceInterviewModal({
  isOpen,
  onClose,
  currentQuestion = "Tell me about a challenging distributed systems bug you resolved.",
  onAnswerSubmit,
}: VoiceInterviewModalProps) {
  const [candidateTranscript, setCandidateTranscript] = useState("");
  const [aiMessage, setAiMessage] = useState(
    "Welcome! Speak naturally into your microphone when you are ready to answer."
  );

  const voice = useVoiceAssistant({
    onTranscriptSegment: (text: string, isFinal: boolean) => {
      if (isFinal) {
        setCandidateTranscript((prev) => (prev ? `${prev} ${text}` : text));
      }
    },
  });

  useEffect(() => {
    if (isOpen && currentQuestion) {
      voice.speakQuestion(currentQuestion);
      setAiMessage(currentQuestion);
    } else {
      voice.stopSpeaking();
    }
  }, [isOpen, currentQuestion]);

  if (!isOpen) return null;

  const handleFinishAnswer = () => {
    if (voice.isListening) {
      voice.toggleListening();
    }
    if (candidateTranscript.trim() && onAnswerSubmit) {
      onAnswerSubmit(candidateTranscript);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700/60 bg-slate-900/95 p-6 shadow-2xl text-slate-100 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-400 border border-blue-500/20">
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                Real-Time Voice Assistant
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-mono text-emerald-400">
                  LIVE STREAM
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Bidirectional AI speech dialogue with active waveform analytics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Live Audio Visualizer */}
        <div className="flex flex-col gap-2">
          <VoiceAssistantVisualizer
            isActive={voice.isListening}
            isAiSpeaking={voice.isSpeaking}
            height={90}
          />
        </div>

        {/* AI Question & Status Dialogue */}
        <div className="rounded-xl border border-purple-500/20 bg-purple-950/20 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 mb-1">
            <Sparkles className="h-3.5 w-3.5 animate-spin" />
            <span>AI Interviewer</span>
          </div>
          <p className="text-sm font-medium text-slate-200">{aiMessage}</p>
        </div>

        {/* Candidate Transcription Area */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 min-h-[100px] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
              <span>Your Speech Transcript:</span>
            </div>
            <p className="text-sm text-slate-300 italic font-sans">
              {candidateTranscript || voice.interimTranscript || (
                <span className="text-slate-500 font-normal">
                  {voice.isListening ? "Listening... start speaking" : "Microphone paused. Click below to begin."}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Controls & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={voice.toggleListening}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium transition ${
                voice.isListening
                  ? "bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30"
                  : "bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-500/20"
              }`}
            >
              {voice.isListening ? (
                <>
                  <MicOff className="h-4 w-4" />
                  <span>Pause Mic</span>
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  <span>Start Speaking</span>
                </>
              )}
            </button>

            {voice.isSpeaking ? (
              <button
                onClick={voice.stopSpeaking}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white"
              >
                <VolumeX className="h-4 w-4 text-purple-400" />
                <span>Mute AI</span>
              </button>
            ) : (
              <button
                onClick={() => voice.speakQuestion(currentQuestion)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white"
              >
                <Volume2 className="h-4 w-4 text-purple-400" />
                <span>Replay Question</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              onClick={handleFinishAnswer}
              disabled={!candidateTranscript.trim()}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-emerald-600/20"
            >
              Submit Answer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
