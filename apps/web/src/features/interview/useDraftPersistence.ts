import { useCallback, useEffect, useRef } from "react";

/**
 * Persists a mid-answer draft to localStorage so a hard refresh doesn't
 * lose the candidate's in-progress answer.
 *
 * - Key is scoped to `sessionId + turnId` so drafts from previous questions
 *   can never bleed into the current one.
 * - Drafts older than 24 hours are silently discarded on read (avoids stale
 *   confusion if a candidate opens an old session much later).
 * - Writes are debounced 300 ms to avoid hammering localStorage on every
 *   keystroke.
 *
 * @returns `{ readDraft, saveDraft, clearDraft }`
 *   - `readDraft()` — call once on mount to get the stored draft (or "").
 *   - `saveDraft(text)` — call whenever the answer changes.
 *   - `clearDraft()` — call immediately after a successful submit.
 */
export function useDraftPersistence(
  sessionId: string,
  turnId: string | undefined
) {
  const DRAFT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  const storageKey = turnId
    ? `interview-draft-${sessionId}-${turnId}`
    : null;

  // Debounce timer ref — avoids a stale closure by storing the id in a ref.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up any pending debounce when the component unmounts or the
  // turn changes (storageKey changes) so we don't write to the wrong key.
  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [storageKey]);

  /**
   * Read the stored draft for the current turn.
   * Returns "" if there is no draft, or the draft has expired.
   */
  const readDraft = useCallback((): string => {
    if (!storageKey) return "";

    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return "";

      const parsed = JSON.parse(raw) as { text: string; savedAt: number };
      const age = Date.now() - parsed.savedAt;

      if (age > DRAFT_TTL_MS) {
        localStorage.removeItem(storageKey);
        return "";
      }

      return parsed.text;
    } catch {
      return "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  /**
   * Persist the current answer text, debounced by 300 ms.
   * Safe to call on every keystroke from onChange handlers.
   */
  const saveDraft = useCallback(
    (text: string): void => {
      if (!storageKey) return;

      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        try {
          localStorage.setItem(
            storageKey,
            JSON.stringify({ text, savedAt: Date.now() })
          );
        } catch {
          // Quota exceeded or private browsing — fail silently.
        }
      }, 300);
    },
    [storageKey]
  );

  /**
   * Remove the stored draft.
   * Call this immediately after a successful answer submission so the
   * next mount of the same turn starts with a blank slate.
   */
  const clearDraft = useCallback((): void => {
    if (!storageKey) return;

    // Cancel any pending debounced write first.
    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Fail silently in restricted environments.
    }
  }, [storageKey]);

  return { readDraft, saveDraft, clearDraft };
}
