import { useCallback, useEffect, useRef, useState } from "react";

export interface UseVoiceAssistantOptions {
  autoSpeakQuestions?: boolean;
  onTranscriptSegment?: (text: string, isFinal: boolean) => void;
}

export interface UseVoiceAssistantResult {
  /** Text-to-Speech (AI Speaking) state */
  isSpeaking: boolean;
  isPaused: boolean;
  ttsSupported: boolean;
  speakQuestion: (text: string) => void;
  stopSpeaking: () => void;
  togglePauseSpeaking: () => void;
  autoSpeak: boolean;
  setAutoSpeak: (val: boolean) => void;

  /** Speech-to-Text (Candidate Dictation) state */
  isListening: boolean;
  sttSupported: boolean;
  interimTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
}

export function useVoiceAssistant(options?: UseVoiceAssistantOptions): UseVoiceAssistantResult {
  const [autoSpeak, setAutoSpeak] = useState(options?.autoSpeakQuestions ?? true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const ttsSupported = typeof window !== "undefined" && "speechSynthesis" in window;
  const sttSupported =
    typeof window !== "undefined" &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  // Stop any active speech on unmount
  useEffect(() => {
    return () => {
      if (ttsSupported) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [ttsSupported]);

  /* -------------------------------------------------------------------------- */
  /*                         Text-To-Speech (AI Voice)                          */
  /* -------------------------------------------------------------------------- */
  const stopSpeaking = useCallback(() => {
    if (!ttsSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, [ttsSupported]);

  const togglePauseSpeaking = useCallback(() => {
    if (!ttsSupported) return;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [ttsSupported]);

  const speakQuestion = useCallback(
    (text: string) => {
      if (!ttsSupported || !text) return;

      window.speechSynthesis.cancel();

      // Clean markdown symbols for natural speech
      const cleanText = text
        .replace(/`{1,3}[^`]*`{1,3}/g, "code block omitted")
        .replace(/[#*_~>-]/g, " ")
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      speechUtteranceRef.current = utterance;

      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = "en-US";

      // Pick a natural English voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Google") ||
            v.name.includes("Natural") ||
            v.name.includes("Samantha") ||
            v.name.includes("Neural") ||
            v.name.includes("Premium"))
      ) || voices.find((v) => v.lang.startsWith("en"));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };

      window.speechSynthesis.speak(utterance);
    },
    [ttsSupported]
  );

  /* -------------------------------------------------------------------------- */
  /*                    Speech-To-Text (Candidate Dictation)                   */
  /* -------------------------------------------------------------------------- */
  const startListening = useCallback(() => {
    const RecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!RecognitionClass) return;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignored
      }
    }

    const recognition = new RecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let interim = "";
      let finalChunk = "";
      const startIndex = event.resultIndex ?? 0;

      for (let i = startIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        if (result.isFinal) {
          finalChunk += result[0].transcript + " ";
        } else {
          interim += result[0].transcript;
        }
      }

      setInterimTranscript(interim);

      if (finalChunk.trim()) {
        options?.onTranscriptSegment?.(finalChunk.trim(), true);
      } else if (interim.trim()) {
        options?.onTranscriptSegment?.(interim.trim(), false);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      setInterimTranscript("");
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  }, [options]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignored
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript("");
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
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
    startListening,
    stopListening,
    toggleListening,
  };
}
