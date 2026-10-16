# Continuous proctoring (frontend)

Client half of the backend `proctoring` module. Runs face/gaze
detection **on-device** and streams only small derived signals to
the backend over Socket.IO — never raw video — which is what keeps
this scalable.

Proctoring is subject-agnostic: every hook takes a `subjectType`
(`"INTERVIEW"` or `"MCQ_ATTEMPT"`) and that subject's `subjectId`
(the interview session id / MCQ attempt id). The backend checks the
signed-in user is that subject's candidate before it opens a session.
The interview room and the MCQ test room (`features/mcq-test`) are the
two consumers - both use `ProctoringGate` for the readiness check and
`useFullscreenEnforcement` + `FullscreenWarningOverlay` for the
fullscreen-exit rules.

## Pre-interview readiness checklist

Before tracking starts, run `useProctoringInit()` to gate the
interview behind a checklist: browser/device compatibility, camera +
microphone permission, connection quality, model loading (TF.js
runtime, COCO-SSD object detector, MediaPipe face model), and
fullscreen.

```tsx
import { useProctoringInit, ProctoringInitChecklist, useProctoring } from "@/features/proctoring";

function PreInterviewGate({ interviewSessionId, accessToken, onReady }: Props) {
  const init = useProctoringInit();
  const proctoring = useProctoring({
    subjectType: "INTERVIEW",
    subjectId: interviewSessionId,
    accessToken,
    videoRef: init.videoRef,
  });

  return (
    <ProctoringInitChecklist
      {...init}
      onReady={() => {
        proctoring.sendSignal({ initStatus: "completed" });
        onReady();
      }}
    />
  );
}
```

Reuse `init.videoRef`'s stream for the interview room itself instead
of calling `getUserMedia` again - `useProctoringInit` already
acquired it during the permission steps.

If a *required* step never passes, report why so it shows up in the
session's timeline instead of silently blocking the candidate:

```ts
proctoring.sendSignal({ initStatus: "failed", initFailureReason: init.failureReason ?? undefined });
```

Two steps are best-effort by nature, not hard guarantees:
- **Internet quality** is optional/non-blocking - there's no
  standard cross-browser bandwidth API, so this uses the Network
  Information API where available (Chromium only) and falls back to
  timing a request to `/health` otherwise (latency, not throughput).
- **Fullscreen** can only be requested from a real user gesture
  (a click), so `start()` runs every other step automatically but
  `enterFullscreen()` must be wired to a button.

## Browser, device & behaviour monitoring

`useProctoring` now also watches for:

- **Browser events** (`useBrowserMonitoring.ts`): exiting fullscreen,
  right-click, copy/paste, and two best-effort signals - a
  keyboard-shortcut + window-size heuristic for devtools, and a
  Print Screen keypress (many OSes intercept this before it reaches
  the browser at all, so it under-detects).
- **Device events** (`useDeviceMonitoring.ts`): camera/mic
  disconnecting mid-interview, internet going offline, a frozen
  webcam feed (currentTime stops advancing), and a best-effort
  "device slept" signal from a large animation-frame gap (can also
  mean the tab was heavily throttled, not necessarily true sleep).
  Pass the *same* stream your `<video>` preview uses via the
  `stream` option - don't call `getUserMedia` again just for this.
- **Behaviour** (`useBehaviorMonitoring.ts`): idle time since the
  last mouse/keyboard/scroll activity, and a rolling-window rapid-
  click detector.

```tsx
const proctoring = useProctoring({
  subjectType: "INTERVIEW",
  subjectId: interviewSessionId,
  accessToken,
  videoRef,
  stream, // same MediaStream backing videoRef
  blockRightClick: true, // optional - default is report-only
});
```

By default these only *report* - set `blockRightClick`/
`blockCopyPaste` if you also want the native browser action
prevented. There's deliberately no attempt at detecting third-party
screen-recording software: there's no reliable, general browser API
for it, so faking a check would be worse than not having one.

## Object detection & multiple people

`useObjectDetection.ts` runs the COCO-SSD model (loaded during init)
against the video feed and reports labels via `objectsDetected` in
the same continuous tick as everything else.

**Honestly scoped to what COCO-SSD can actually see**: its fixed
80-class vocabulary gives you "cell phone", "laptop", "book", and
"tv" (used as the closest proxy for a second monitor). It has no
classes for a tablet, calculator, loose paper, earphones, or
smartwatch - those would need a different, custom-labeled model, so
they're left undetected rather than faked.

Multiple people is handled two ways:
- **`faceCount`** (already existed) - `useProctoring` reports it every
  tick; the backend flags 2 faces as HIGH severity and 3+ as CRITICAL.
- **`personCountEvent`** - a one-shot `"stranger_entered"` /
  `"stranger_left"` sent only on the tick where the face count
  crosses the 1 <-> 2+ boundary, so the event timeline shows exactly
  when someone joined or left rather than a flag firing every tick
  they're in frame.

## Risk score, evidence timeline & report

`ProctoringReportCard` (in `components/`) renders the end-of-interview
report: a 0-100 risk score, risk level, violation count, a summary,
a recommendation, and the full evidence timeline.

```tsx
import { useProctoringReport, ProctoringReportCard } from "@/features/proctoring";

function InterviewReportSection({ interviewSessionId, isRecruiter }: Props) {
  // Reports are looked up by subject id - an interview id or an MCQ attempt id.
  const { data: report } = useProctoringReport(interviewSessionId);
  if (!report) return null; // proctoring wasn't enabled for this interview

  return <ProctoringReportCard report={report} canReview={isRecruiter} />;
}
```

**Risk score vs trust score**: `trustScore` (already existed) drives
the *live* auto-flag threshold via a generic severity-tier deduction.
`riskScore` is new - it's per-event-type weighted (see the backend's
`RiskEngine.ts`, e.g. a detected phone counts for far more than one
glance away) and is what the report shows. Both climb for the same
underlying reason, but they're not literal inverses of each other.

**Evidence**: each MEDIUM+ severity event may carry a `cameraFrame` -
a base64 snapshot of the candidate's feed at that moment, shown as a
thumbnail in the timeline. Not every event has one, by design (see
the backend's evidence-attachment comment in
`RuleBasedProctoringAgent.ts`). There's no "Screenshot" (full page/
screen capture) - that would need an already-active `getDisplayMedia`
stream, which isn't guaranteed to exist, so it's left undone rather
than faked.

**Summary is deterministic, not an LLM call** - `ReportSummary.ts` on
the backend generates it from a template, same "Mock" fallback
pattern used elsewhere in this codebase. Swap in a real LLM call
later without changing anything else if you want more natural prose.

**Recruiter review**: pass `canReview` to show Acknowledge/Dismiss
buttons on `DETECTED` events, wired to
`useUpdateProctoringEventStatus`. The backend enforces the
recruiter-only role check regardless of what the UI shows.

**Recruiter-facing pages**: `pages/FlaggedSessionsPage.tsx` lists
sessions the backend already flagged (`GET /sessions/flagged`),
showing each one's `riskLevel` directly from the session response -
no client-side re-derivation needed. `pages/ProctoringSessionDetailPage.tsx`
renders the full `ProctoringReportCard` with review enabled. Both are
gated to recruiter/faculty/admin/super_admin, both client-side (the
nav link and the page's own check) and server-side (every proctoring
route that needs it).

## Setup

1. Dependencies are already added to `package.json`:
   `@mediapipe/tasks-vision`, `@tensorflow/tfjs`, and
   `@tensorflow-models/coco-ssd`. Run `npm install` if you haven't.
2. Set the API URL your socket (and the init checklist's connection
   check) should connect to:

   ```
   # apps/web/.env.local
   VITE_API_URL=http://localhost:5000
   ```

3. For production, download the two MediaPipe assets once and serve
   them from your own origin/CDN instead of Google's, then pass them
   in:

   ```ts
   useFaceTracking(videoRef, {
     wasmBase: "/assets/mediapipe/wasm",
     modelAssetPath: "/assets/mediapipe/face_landmarker.task",
   });
   ```

   This avoids a third-party CDN dependency and keeps the model
   fully same-origin/offline-capable.

## Usage

```tsx
import { useRef } from "react";
import { useProctoring, ProctoringBadge } from "@/features/proctoring";

function InterviewRoom({ interviewSessionId, accessToken }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const proctoring = useProctoring({
    subjectType: "INTERVIEW",
    subjectId: interviewSessionId,
    accessToken,
    videoRef,
    intervalMs: 3000,       // how often to send a signal
    screenShareRequired: false,
  });

  return (
    <div>
      <video ref={videoRef} autoPlay muted playsInline />
      <ProctoringBadge {...proctoring} />
    </div>
  );
}
```

Make sure `videoRef` is attached to the candidate's own camera
preview (from `getUserMedia`) — this feature only reads frames that
are already on the page, it doesn't request camera access itself.

## What gets sent, and how often

Every `intervalMs` (default 3s), one small JSON object goes out over
the `/proctoring` socket namespace:

```ts
{
  faceCount, faceVisible, gazeAwayDurationMs,
  facePosition, headPose, eyesClosedDurationMs,
  tabFocused, screenShareRequired, connectionUnstable,
}
```

`facePosition` (`in_frame` / `too_far` / `too_close` / `out_of_frame`
/ `partially_visible` / `covered`) and `headPose` (`center` / `left`
/ `right` / `up` / `down` / `behind`) come from lightweight
2D-landmark heuristics in `useFaceTracking.ts` - not a calibrated 3D
pose model. The thresholds are reasonable starting points; tune them
against real footage before relying on them for high-stakes
decisions. `covered` in particular is inferred (a centered, normally
posed face vanishing abruptly) rather than directly detected - a
browser can't confirm actual occlusion.

No image or video data leaves the browser as part of continuous
tracking. `frameBase64` exists on the backend's signal type for
agents that want an occasional snapshot (e.g. identity
re-verification every 30–60s) — this frontend doesn't send it yet;
add it deliberately (with clear candidate disclosure) if/when you
wire up an agent that uses it.

## Extending detection

- **More signals**: add fields to `types.ts` (`ProctoringSignal`) and
  compute them in `useProctoring.ts` — the backend's
  `RecordSignalSchema` will need matching optional fields.
- **Object detection** (phone/book on desk): done - `useObjectDetection.ts`
  runs `model.detect(video)` on an interval using the same singleton
  `getCocoSsdModel()` loaded during the init checklist, and merges
  labels into `objectsDetected: string[]`. Only phone/laptop/book/tv
  are reported - see that file's comment for why the rest of COCO's
  80 classes aren't a fit for the remaining object types in the spec.
- **Multiple voices**: done, with real limits worth knowing -
  `useAudioMonitoring.ts` runs the mic `MediaStream` through a
  time-domain autocorrelation pitch tracker (no ML model) and flags
  `multipleVoicesDetected` when recent pitch samples cluster into two
  well-separated, well-populated bands over a rolling ~4s window. This
  is a coarse heuristic, not real speaker diarization: it can false-
  positive on one expressive speaker's pitch range, and false-negative
  on two similar-pitched voices. Treat it as a soft signal worth human
  review, same as every other flag here - see the file's doc comment
  for the exact thresholds and failure modes.
- **Loud noise**: done - the same audio hook flags `audioAnomaly` on
  sustained RMS well above normal speaking volume (debounced across a
  couple of samples). **Not implemented, on purpose**: Continuous
  Talking (indistinguishable from a candidate legitimately answering
  at length, without knowing whether a question is currently being
  asked), TV Detection and Whisper Detection (both need signal
  properties a volume/pitch heuristic can't reliably isolate) - see
  `useAudioMonitoring.ts`'s doc comment for the full reasoning.

None of this requires backend changes — `IProctoringAgent` on the
server just reads whatever fields are present on the signal.
