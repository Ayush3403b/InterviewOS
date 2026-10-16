import { useEffect, useRef } from "react";

import { isFullscreenActive } from "./deviceChecks";
import type { BrowserEvent } from "./types";

/**
 * Devtools-open heuristic threshold: when the gap between outer and
 * inner window dimensions grows past this (px), a docked devtools
 * panel is the most common cause. Not reliable on every browser/OS
 * combination and can false-positive on some window managers - kept
 * as a secondary signal alongside the keyboard-shortcut heuristic
 * below, not a standalone source of truth.
 */
const DEVTOOLS_SIZE_THRESHOLD_PX = 160;
const DEVTOOLS_POLL_INTERVAL_MS = 1000;

export interface UseBrowserMonitoringOptions {
  /** Prevent the browser's native context menu on right-click. Default: false. */
  blockRightClick?: boolean;
  /** Prevent copy/paste from completing. Default: false. */
  blockCopyPaste?: boolean;
}

/**
 * Watches for discrete browser-level events relevant to proctoring:
 * exiting fullscreen, a best-effort devtools-open heuristic,
 * right-click, copy/paste, and a best-effort Print Screen key press.
 *
 * Fires `onEvent` once per occurrence - wire it straight to
 * `useProctoring().sendSignal({ browserEvent: event })`.
 *
 * Two of these are honest best-effort signals, not guarantees:
 *  - `devtools_opened` combines a keyboard-shortcut check with a
 *    window-size heuristic. Neither confirms devtools is actually
 *    open; both are the standard tricks available to a web page.
 *  - `print_screen_attempt` only fires if the OS lets the
 *    "PrintScreen" key reach the browser at all, which many
 *    operating systems don't do by default.
 */
export function useBrowserMonitoring(
  onEvent: (event: BrowserEvent) => void,
  options?: UseBrowserMonitoringOptions
) {
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  const wasFullscreenRef = useRef(isFullscreenActive());
  const devtoolsFlaggedRef = useRef(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen = isFullscreenActive();
      if (wasFullscreenRef.current && !isFullscreen) {
        onEventRef.current("fullscreen_exited");
      }
      wasFullscreenRef.current = isFullscreen;
    };

    const handleContextMenu = (event: MouseEvent) => {
      if (options?.blockRightClick) {
        event.preventDefault();
      }
      onEventRef.current("right_click");
    };

    const handleCopy = (event: ClipboardEvent) => {
      if (options?.blockCopyPaste) {
        event.preventDefault();
      }
      onEventRef.current("copy_attempt");
    };

    const handlePaste = (event: ClipboardEvent) => {
      if (options?.blockCopyPaste) {
        event.preventDefault();
      }
      onEventRef.current("paste_attempt");
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "PrintScreen") {
        onEventRef.current("print_screen_attempt");
        return;
      }

      const isDevtoolsShortcut =
        event.key === "F12" ||
        ((event.ctrlKey || event.metaKey) &&
          event.shiftKey &&
          ["I", "J", "C", "i", "j", "c"].includes(event.key));

      if (isDevtoolsShortcut) {
        onEventRef.current("devtools_opened");
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("keydown", handleKeyDown);

    const sizeCheckInterval = setInterval(() => {
      const gapWidth = window.outerWidth - window.innerWidth;
      const gapHeight = window.outerHeight - window.innerHeight;
      const likelyOpen =
        gapWidth > DEVTOOLS_SIZE_THRESHOLD_PX || gapHeight > DEVTOOLS_SIZE_THRESHOLD_PX;

      if (likelyOpen && !devtoolsFlaggedRef.current) {
        devtoolsFlaggedRef.current = true;
        onEventRef.current("devtools_opened");
      } else if (!likelyOpen) {
        devtoolsFlaggedRef.current = false;
      }
    }, DEVTOOLS_POLL_INTERVAL_MS);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("keydown", handleKeyDown);
      clearInterval(sizeCheckInterval);
    };
    // Listeners close over refs, not the raw callback/options, so they
    // don't need to be re-attached when a new function identity is
    // passed in on every render.
  }, [options?.blockRightClick, options?.blockCopyPaste]);
}
