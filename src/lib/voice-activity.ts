import type { Segment } from "./speech-metrics";

/**
 * Browser-only, energy-based voice-activity tracker for a live MediaStream. It records when
 * someone is actually making sound so speaking time and pauses come from real audio timing.
 * Times are milliseconds from `origin` (performance.now() based).
 */
export type VoiceActivityTracker = {
  readonly speaking: boolean;
  segments(): Segment[];
  stop(): Segment[];
};

export function trackVoiceActivity(
  stream: MediaStream,
  options: {
    origin: number;
    /** Track enabled check, e.g. skip while the mic is muted. */
    isActive?: () => boolean;
    onChange?: (speaking: boolean) => void;
    minRms?: number;
    hangoverMs?: number;
    minSegmentMs?: number;
  },
): VoiceActivityTracker {
  const minRms = options.minRms ?? 0.012;
  const hangover = options.hangoverMs ?? 280;
  const minSegment = options.minSegmentMs ?? 150;
  const done: Segment[] = [];
  let ctx: AudioContext | undefined;
  let timer: ReturnType<typeof setInterval> | undefined;
  let speaking = false;
  let segStart = 0;
  let lastVoice = 0;
  let noiseFloor = 0.01;

  const close = (at: number) => {
    if (!speaking) return;
    speaking = false;
    const end = Math.max(segStart, lastVoice);
    if (end - segStart >= minSegment) done.push({ start: segStart, end });
    options.onChange?.(false);
    void at;
  };

  try {
    ctx = new AudioContext();
    void ctx.resume().catch(() => undefined);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const data = new Float32Array(analyser.fftSize);
    timer = setInterval(() => {
      const now = performance.now() - options.origin;
      if (options.isActive && !options.isActive()) {
        close(now);
        return;
      }
      analyser.getFloatTimeDomainData(data);
      let sum = 0;
      for (const v of data) sum += v * v;
      const rms = Math.sqrt(sum / data.length);
      // Slowly adapt to background noise; speech must clearly exceed it.
      if (!speaking) noiseFloor = noiseFloor * 0.97 + rms * 0.03;
      const voiced = rms > Math.max(minRms, noiseFloor * 2.5);
      if (voiced) {
        lastVoice = now;
        if (!speaking) {
          speaking = true;
          segStart = now;
          options.onChange?.(true);
        }
      } else if (speaking && now - lastVoice > hangover) close(now);
    }, 30);
  } catch {
    /* Web Audio unavailable: no timing data, analytics will report it as unavailable. */
  }

  return {
    get speaking() {
      return speaking;
    },
    segments: () => [...done, ...(speaking ? [{ start: segStart, end: lastVoice }] : [])],
    stop: () => {
      clearInterval(timer);
      close(performance.now() - options.origin);
      void ctx?.close().catch(() => undefined);
      return [...done];
    },
  };
}
