import { useEffect, useRef } from "react";

/**
 * Tracks whether the tab is focused/visible right now, with zero
 * dependencies - this needs no ML model, just the Page Visibility
 * and window focus/blur APIs, so it's always-on regardless of
 * whether face-tracking is available.
 */
export function useTabFocus() {
  const focusedRef = useRef(true);

  useEffect(() => {
    const handleVisibility = () => {
      focusedRef.current = document.visibilityState === "visible";
    };

    const handleBlur = () => {
      focusedRef.current = false;
    };

    const handleFocus = () => {
      focusedRef.current = document.visibilityState === "visible";
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  return focusedRef;
}
