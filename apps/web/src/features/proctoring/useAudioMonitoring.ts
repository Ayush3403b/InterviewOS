import { useEffect, useRef } from "react";

const SAMPLE_INTERVAL_MS = 250;
const VOICE_RMS_THRESHOLD = 0.02;
const PITCH_HISTORY_WINDOW_MS = 4000;
const PITCH_CLUSTER_GAP_HZ = 35;
const MIN_SAMPLES_PER_CLUSTER = 4;
const MIN_VOICED_FREQ_HZ = 80;
const MAX_VOICED_FREQ_HZ = 400;
const MIN_CORRELATION = 0.01;

/**
 * RMS well above normal speaking volume - a shout, a door slam, a
 * dropped object. Requires two consecutive samples above this to
 * debounce single-sample glitches, same pattern as the webcam-freeze
 * check in useDeviceMonitoring.ts.
 */
const LOUD_NOISE_RMS_THRESHOLD = 0.35;
const LOUD_NOISE_CONSECUTIVE_SAMPLES = 2;

export interface AudioMonitoringSnapshot {
  /** True once the audio graph is set up and actively sampling. */
  ready: boolean;
  /** Whether the current tick's volume looks like active speech (vs. silence). */
  voiceActive: boolean;
  /** 0-1 RMS volume, for a rough background-noise/loudness read. */
  audioLevel: number;
  /** See the heuristic's limitations in the function doc below. */
  multipleVoicesLikely: boolean;
  /** Sustained RMS well above normal speaking volume. */
  loudNoiseDetected: boolean;
}

/**
 * Not implemented here, on purpose, same reasoning as the object-
 * detection scope note in useObjectDetection.ts:
 *  - **Continuous Talking**: a candidate answering a question at
 *    length looks identical to this signal - without knowing whether
 *    a question is currently being asked (which this hook doesn't),
 *    flagging it would mostly catch normal interview behavior, not
 *    misconduct. Not worth the false-positive rate.
 *  - **TV Detection**: would need an audio-classification model
 *    (recognizing TV/media audio specifically) - a pitch/volume
 *    heuristic can't tell a television apart from a second person.
 *  - **Whisper Detection**: a whisper is quiet and low-energy in a
 *    way that's easily confused with normal quiet background noise
 *    or simply sitting further from the mic - no threshold here can
 *    reliably tell those apart.
 */

/**
 * Coarse, honest heuristic for "more than one person may be speaking" -
 * this is NOT real speaker diarization (that needs a trained model,
 * same reasoning as why useObjectDetection doesn't fake classes
 * COCO-SSD can't actually detect). What it does instead: tracks the
 * estimated fundamental pitch (via time-domain autocorrelation) during
 * voiced segments over a rolling few-second window, and flags when
 * those pitches cluster into two well-separated bands with enough
 * samples in each - a pattern more consistent with two alternating or
 * overlapping voices than one person's natural pitch variation.
 *
 * Known failure modes, on purpose left as-is rather than hidden:
 *  - False positive: one expressive speaker with a wide pitch range
 *  - False negative: two speakers with similar-enough pitch
 * Treat `multipleVoicesLikely` as a soft signal worth a human review,
 * not a verdict - same spirit as every other proctoring flag here.
 *
 * `loudNoiseDetected` is simpler and more reliable: sustained RMS
 * volume well above normal speaking level (shouting, a door slam, a
 * dropped object), debounced across a couple of samples so a single
 * glitchy reading doesn't fire it.
 *
 * Degrades to `{ ready: false }` if AudioContext/getFloatTimeDomainData
 * aren't available or the stream has no audio track, rather than
 * throwing - the rest of continuous tracking keeps working either way.
 */
export function useAudioMonitoring(stream: MediaStream | null) {
  const snapshotRef = useRef<AudioMonitoringSnapshot>({
    ready: false,
    voiceActive: false,
    audioLevel: 0,
    multipleVoicesLikely: false,
    loudNoiseDetected: false,
  });

  useEffect(() => {
    if (!stream || stream.getAudioTracks().length === 0) {
      return;
    }

    let cancelled = false;
    let audioContext: AudioContext | undefined;
    let intervalId: ReturnType<typeof setInterval> | undefined;
    const pitchHistory: { pitch: number; at: number }[] = [];

    try {
      audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      const buffer = new Float32Array(analyser.fftSize);
      const sampleRate = audioContext.sampleRate;

      snapshotRef.current.ready = true;

      let loudSampleStreak = 0;

      intervalId = setInterval(() => {
        if (cancelled) return;

        analyser.getFloatTimeDomainData(buffer);

        const rms = computeRms(buffer);
        const voiceActive = rms >= VOICE_RMS_THRESHOLD;

        snapshotRef.current.audioLevel = rms;
        snapshotRef.current.voiceActive = voiceActive;

        if (rms >= LOUD_NOISE_RMS_THRESHOLD) {
          loudSampleStreak += 1;
        } else {
          loudSampleStreak = 0;
        }
        snapshotRef.current.loudNoiseDetected =
          loudSampleStreak >= LOUD_NOISE_CONSECUTIVE_SAMPLES;

        if (voiceActive) {
          const pitch = estimatePitch(buffer, sampleRate);
          if (
            pitch !== null &&
            pitch >= MIN_VOICED_FREQ_HZ &&
            pitch <= MAX_VOICED_FREQ_HZ
          ) {
            pitchHistory.push({ pitch, at: Date.now() });
          }
        }

        const cutoff = Date.now() - PITCH_HISTORY_WINDOW_MS;
        while (pitchHistory.length && pitchHistory[0].at < cutoff) {
          pitchHistory.shift();
        }

        snapshotRef.current.multipleVoicesLikely = detectsTwoClusters(
          pitchHistory.map((entry) => entry.pitch)
        );
      }, SAMPLE_INTERVAL_MS);
    } catch (error) {
      console.warn(
        "[proctoring] audio monitoring unavailable, continuing without it:",
        error
      );
    }

    return () => {
      cancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
      audioContext?.close().catch(() => {});
    };
  }, [stream]);

  return { snapshotRef };
}

function computeRms(buffer: Float32Array): number {
  let sumSquares = 0;
  for (let i = 0; i < buffer.length; i++) {
    sumSquares += buffer[i] * buffer[i];
  }
  return Math.sqrt(sumSquares / buffer.length);
}

/**
 * Time-domain autocorrelation pitch estimate. Returns null when no
 * clear periodicity is found (unvoiced sound, noise, silence).
 */
function estimatePitch(buffer: Float32Array, sampleRate: number): number | null {
  const minLag = Math.floor(sampleRate / MAX_VOICED_FREQ_HZ);
  const maxLag = Math.floor(sampleRate / MIN_VOICED_FREQ_HZ);

  let bestLag = -1;
  let bestCorrelation = 0;

  for (let lag = minLag; lag <= maxLag && lag < buffer.length; lag++) {
    let correlation = 0;
    for (let i = 0; i < buffer.length - lag; i++) {
      correlation += buffer[i] * buffer[i + lag];
    }
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestLag = lag;
    }
  }

  if (bestLag <= 0) {
    return null;
  }

  const normalized = bestCorrelation / (buffer.length - bestLag);
  if (normalized < MIN_CORRELATION) {
    return null;
  }

  return sampleRate / bestLag;
}

/**
 * Splits sorted pitch samples at their largest gap and checks whether
 * both resulting groups are well-separated and large enough to be
 * real clusters rather than a couple of noisy outliers.
 */
function detectsTwoClusters(pitches: number[]): boolean {
  if (pitches.length < MIN_SAMPLES_PER_CLUSTER * 2) {
    return false;
  }

  const sorted = [...pitches].sort((a, b) => a - b);

  let largestGap = 0;
  let splitIndex = -1;

  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i] - sorted[i - 1];
    if (gap > largestGap) {
      largestGap = gap;
      splitIndex = i;
    }
  }

  if (largestGap < PITCH_CLUSTER_GAP_HZ || splitIndex === -1) {
    return false;
  }

  const lowerCluster = sorted.slice(0, splitIndex);
  const upperCluster = sorted.slice(splitIndex);

  return (
    lowerCluster.length >= MIN_SAMPLES_PER_CLUSTER &&
    upperCluster.length >= MIN_SAMPLES_PER_CLUSTER
  );
}
