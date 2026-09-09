export type TypewriterFrame = { at: number; text: string };
export type TypewriterOptions = { durationMs?: number; maxFrames?: number };

const DEFAULT_DURATION_MS = 1400;
const DEFAULT_MAX_FRAMES = 24;

/**
 * Split `text` into a small number of growing prefixes spread across
 * `durationMs`, so a plain `setState(text)` handler renders as visible
 * typing instead of the full string appearing in one frame. Frame count is
 * capped so a long note cannot schedule one timer per character.
 */
export function typewriterFrames(
  text: string,
  options: TypewriterOptions = {},
): TypewriterFrame[] {
  const { durationMs = DEFAULT_DURATION_MS, maxFrames = DEFAULT_MAX_FRAMES } =
    options;

  if (text.length === 0) return [{ at: 0, text: "" }];

  const frameCount = Math.min(text.length, maxFrames);
  const frames: TypewriterFrame[] = [];
  for (let i = 1; i <= frameCount; i++) {
    const progress = i / frameCount;
    const charIndex = Math.max(1, Math.round(progress * text.length));
    frames.push({
      at: Math.round(progress * durationMs),
      text: text.slice(0, charIndex),
    });
  }
  // Guarantee the exact final text at exactly durationMs regardless of
  // rounding above.
  frames[frames.length - 1] = { at: durationMs, text };
  return frames;
}
