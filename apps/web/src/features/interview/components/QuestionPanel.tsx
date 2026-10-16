import { useEffect, useState } from "react";
import { Send, Code2, MessageSquare } from "lucide-react";
import { CodeWorkspace } from "../../coding";
import { useVoiceAssistant, VoiceAssistantControls } from "../../voice-assistant";

interface QuestionPanelProps {
  questionNumber: number;
  totalQuestions: number;
  question: string | undefined;
  answer: string;
  onAnswerChange: (value: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  loadingQuestion: boolean;
}

export function QuestionPanel({
  questionNumber,
  totalQuestions,
  question,
  answer,
  onAnswerChange,
  onSubmit,
  submitting,
  loadingQuestion,
}: QuestionPanelProps) {
  const [showCodeEditor, setShowCodeEditor] = useState(false);

  const voiceAssistant = useVoiceAssistant({
    autoSpeakQuestions: true,
    onTranscriptSegment: (text, isFinal) => {
      if (isFinal) {
        const next = answer.trim() ? `${answer.trim()} ${text}.` : `${text}.`;
        onAnswerChange(next);
      }
    },
  });

  // Automatically read new questions aloud when they load (if autoSpeak is enabled)
  useEffect(() => {
    if (question && !loadingQuestion && voiceAssistant.autoSpeak) {
      voiceAssistant.speakQuestion(question);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, loadingQuestion]);

  const handleInsertCode = (formattedCodeBlock: string) => {
    const newAnswer = answer.trim()
      ? `${answer}\n\n${formattedCodeBlock}`
      : formattedCodeBlock;
    onAnswerChange(newAnswer);
  };

  const handleSubmit = () => {
    if (voiceAssistant.isListening) {
      voiceAssistant.stopListening();
    }
    if (voiceAssistant.isSpeaking) {
      voiceAssistant.stopSpeaking();
    }
    onSubmit();
  };

  // Automatically turn off dictation/speaking if submitting begins
  useEffect(() => {
    if (submitting) {
      voiceAssistant.stopListening();
      voiceAssistant.stopSpeaking();
    }
  }, [submitting, voiceAssistant]);

  return (
    <div className="rounded-2xl border border-line bg-panel p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs text-ink-soft">
          Question {questionNumber} of {totalQuestions}
        </p>
        <div className="flex gap-1">
          {Array.from({ length: totalQuestions }).map((_, index) => (
            <span
              key={index}
              className={`h-1.5 w-6 rounded-full ${
                index < questionNumber - 1
                  ? "bg-live"
                  : index === questionNumber - 1
                    ? "bg-signal"
                    : "bg-line"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="min-h-[3.5rem]">
        {loadingQuestion ? (
          <p className="text-sm text-ink-soft">Loading question...</p>
        ) : (
          <h2 className="font-display text-lg font-semibold text-ink">
            {question}
          </h2>
        )}
      </div>

      {/* Interactive AI Voice Assistant Controls */}
      <VoiceAssistantControls
        {...voiceAssistant}
        questionText={question}
      />

      {/* Editor & Answer Mode Tabs */}
      <div className="flex items-center justify-between pt-2 border-t border-line/60">
        <div className="flex items-center gap-1 bg-surface p-1 rounded-lg border border-line text-xs font-medium">
          <button
            type="button"
            onClick={() => setShowCodeEditor(false)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition ${
              !showCodeEditor
                ? "bg-panel text-ink shadow-sm"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Written Explanation
          </button>
          <button
            type="button"
            onClick={() => setShowCodeEditor(true)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition ${
              showCodeEditor
                ? "bg-panel text-signal shadow-sm"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            Live Code Workspace
          </button>
        </div>

        <span className="text-xs text-ink-soft">
          {showCodeEditor ? "Write & test algorithms" : "Explain approach & structure"}
        </span>
      </div>

      {/* Live Coding Workspace */}
      {showCodeEditor && (
        <div className="pt-1">
          <CodeWorkspace onInsertIntoAnswer={handleInsertCode} />
        </div>
      )}

      {/* Answer Text Area */}
      <div>
        <label className="block text-xs font-medium text-ink-soft mb-1">
          Candidate Response:
        </label>
        <textarea
          value={answer}
          onChange={(event) => onAnswerChange(event.target.value)}
          disabled={loadingQuestion || submitting}
          placeholder="Explain your approach, design tradeoffs, or paste solutions here..."
          rows={showCodeEditor ? 4 : 7}
          className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none transition placeholder:text-slate-400 focus:border-signal focus:ring-2 focus:ring-signal/20 disabled:opacity-60 font-sans"
        />
      </div>

      <div className="mt-3 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={loadingQuestion || submitting || !answer.trim()}
          className="flex items-center gap-2 rounded-lg bg-signal px-4 py-2.5 text-sm font-medium text-white transition hover:bg-signal-strong disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {questionNumber === totalQuestions
            ? submitting
              ? "Finishing up..."
              : "Submit final answer"
            : submitting
              ? "Submitting..."
              : "Submit & next question"}
        </button>
      </div>
    </div>
  );
}
