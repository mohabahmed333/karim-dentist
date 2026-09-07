import { pushWaveSample } from "./voiceRecorderHelpers";

/** Enough columns for thin bars with ~bar-width gaps across the pill. */
export const WAVE_MAX = 80;

export function pickVoiceMime(): string {
  return MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : "audio/webm";
}

export function buildVoiceFile(chunks: Blob[], mime: string): File {
  const blob = new Blob(chunks, { type: mime || "audio/webm" });
  return new File([blob], `voice-${Date.now()}.webm`, { type: blob.type });
}

/** Live mic → scrolling waveform with silence dots + speech peaks. */
export function startLevelLoop(
  stream: MediaStream,
  isLive: () => boolean,
  onSample: (samples: number[]) => void,
): () => void {
  const ctx = new AudioContext();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.15;
  source.connect(analyser);
  const data = new Uint8Array(analyser.fftSize);
  let waves = Array.from({ length: WAVE_MAX }, () => 0);
  let raf = 0;
  let peak = 0;
  let lastPush = 0;
  const PUSH_MS = 55;

  const loop = (now: number) => {
    if (isLive()) {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      let maxAbs = 0;
      for (let i = 0; i < data.length; i += 1) {
        const v = (data[i]! - 128) / 128;
        sum += v * v;
        maxAbs = Math.max(maxAbs, Math.abs(v));
      }
      const rms = Math.sqrt(sum / data.length);
      // Blend RMS + peak so speech bursts look like the reference.
      const raw = Math.min(1, rms * 5.5 + maxAbs * 0.35);
      const level = raw < 0.045 ? 0 : Math.min(1, (raw - 0.045) / 0.85);
      peak = Math.max(peak, level);

      if (now - lastPush >= PUSH_MS) {
        waves = pushWaveSample(waves, peak, WAVE_MAX);
        onSample(waves);
        peak = 0;
        lastPush = now;
      }
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(raf);
    void ctx.close().catch(() => undefined);
  };
}
