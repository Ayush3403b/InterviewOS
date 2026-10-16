import { useCallback, useRef, useState } from "react";

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    SpeechRecognition?: new () => SpeechRecognitionLike;
  }

  interface SpeechRecognitionLike extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((event: SpeechRecognitionEventLike) => void) | null;
    onerror: ((event: Event) => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
  }

  interface SpeechRecognitionEventLike extends Event {
    /** Index of the first result that changed in this event. */
    resultIndex?: number;
    results: {
      [index: number]: {
        [index: number]: { transcript: string };
        isFinal: boolean;
      };
      length: number;
    };
  }
}

export interface UseVoiceTranscriptResult {
  listening: boolean;
  supported: boolean;
  transcript: string;
  error: string | null;
  start: () => void;
  stop: () => void;
}

/**
 * Wraps the browser's native SpeechRecognition API for live
 * speech-to-text. Only available in Chromium-based browsers today
 * (no Firefox/Safari support) - `supported` reflects that so the UI
 * can degrade gracefully instead of silently doing nothing.
 */
export function useVoiceTranscript(
  onTranscript?: (transcript: string, isFinal: boolean) => void
): UseVoiceTranscriptResult {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const supported =
    typeof window !== "undefined" &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  const start = useCallback(() => {
    const RecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!RecognitionClass) {
      setError("Speech recognition isn't supported in this browser.");
      return;
    }

    const recognition = new RecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const lastIndex = event.results.length - 1;
      const result = event.results[lastIndex];
      const text = result[0].transcript;

      setTranscript(text);
      onTranscript?.(text, result.isFinal);
    };

    recognition.onerror = () => {
      setError("Voice capture error.");
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setError(null);
    setListening(true);
  }, [onTranscript]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
  }, []);

  return { listening, supported, transcript, error, start, stop };
}
