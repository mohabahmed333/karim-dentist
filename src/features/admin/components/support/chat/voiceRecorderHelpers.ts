/** Voice note timer + waveform sample ring (pure helpers). */

export function formatVoiceClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export function pushWaveSample(
  samples: number[],
  next: number,
  max: number,
): number[] {
  const clamped = Math.min(1, Math.max(0, next));
  const out = [...samples, clamped];
  if (out.length <= max) return out;
  return out.slice(out.length - max);
}

/** Pill bar height — silence is a round dot (width === height). */
export function waveBarHeightPx(
  level: number,
  trackPx: number,
  barPx: number,
): number {
  const gated = level < 0.05 ? 0 : Math.min(1, Math.max(0, level));
  if (gated === 0) return barPx;
  return Math.round(barPx + gated * (trackPx - barPx));
}

/** Map pointer X on a track to 0–1 seek ratio (LTR/RTL-aware). */
export function seekRatioFromClientX(
  clientX: number,
  trackLeft: number,
  trackWidth: number,
  rtl = false,
): number {
  if (trackWidth <= 0) return 0;
  const local = (clientX - trackLeft) / trackWidth;
  const ratio = rtl ? 1 - local : local;
  return Math.min(1, Math.max(0, ratio));
}

const END_EPSILON_SEC = 0.08;

/** True when native ended fired or playhead is at/near duration. */
export function isPreviewAtEnd(
  currentTime: number,
  duration: number,
  endedFlag: boolean,
): boolean {
  if (endedFlag) return true;
  const dur = Math.max(0.001, duration);
  return currentTime >= dur - END_EPSILON_SEC;
}

/** UI snap when preview finishes — playhead at end, not playing. */
export function previewStateAtEnd(duration: number): {
  playing: false;
  progress: 1;
  seconds: number;
} {
  return {
    playing: false,
    progress: 1,
    seconds: Math.max(0, duration),
  };
}

export function previewProgressFromTime(
  currentTime: number,
  duration: number,
): number {
  const dur = Math.max(0.001, duration);
  return Math.min(1, Math.max(0, currentTime / dur));
}

/** After finishing, next Play should restart from 0. */
export function shouldRestartFromStart(progress: number): boolean {
  return progress >= 0.995;
}
