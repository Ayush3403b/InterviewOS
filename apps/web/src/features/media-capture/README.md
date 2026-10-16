# Media capture (camera, mic, location, voice)

Three independent, reusable hooks - none of them know anything about
proctoring or interviews. A composing component (see
`features/interview/components/InterviewMediaPanel.tsx`) wires them
together and decides what to report.

- **`useCameraCapture`** - owns `getUserMedia({video, audio})`,
  exposes a `videoRef` you can put on a `<video>` element *and* pass
  straight into `useProctoring({ videoRef })` so face-tracking runs
  on the same stream.
- **`useGeolocation`** - one-shot `fetchLocation()`, not continuous
  watching (candidates only need this captured once, typically at
  interview start).
- **`useVoiceTranscript`** - wraps the browser's native
  `SpeechRecognition` API. Chromium-only today (no Firefox/Safari) -
  check `supported` before showing the control.

## Wiring into proctoring

`useProctoring` now returns a `sendSignal()` you can call directly
whenever one of these hooks fires, instead of waiting for the next
polling tick:

```tsx
const camera = useCameraCapture();
const location = useGeolocation();
const proctoring = useProctoring({
  subjectType: "INTERVIEW",
  subjectId: interviewSessionId,
  accessToken,
  videoRef: camera.videoRef,
});

const handleStartCamera = async () => {
  await camera.start();
  proctoring.sendSignal({ cameraState: "started" });
};

const handleFetchLocation = async () => {
  const coords = await location.fetchLocation();
  if (coords) proctoring.sendSignal({ location: coords });
};

const voice = useVoiceTranscript((transcript, isFinal) => {
  if (isFinal) proctoring.sendSignal({ voiceTranscriptSnippet: transcript });
});
```

These show up in the backend's existing proctoring event timeline
(`GET /proctoring/sessions/:id/events` / `/report`) as `INFO`-severity
entries (`CAMERA_STARTED`, `LOCATION_CAPTURED`,
`VOICE_TRANSCRIPT_CAPTURED`, etc.) - informational, not violations, so
they never affect trust score. No new backend endpoints or storage
were added; this reuses the proctoring pipeline that already exists.

## Permissions

Camera, mic, and geolocation all require HTTPS (or `localhost`) and
an explicit browser permission prompt. Handle `camera.error` /
`location.status === "denied"` in the UI - don't assume they'll
always succeed.
