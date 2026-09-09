export type ShowreelBeatStep = { id: string; at: number; beat?: string };
export type ShowreelBeat = { id: string; at: number; label: string };

/**
 * The caption text active at `timeMs`. A step's `beat` starts a new caption
 * that holds through every following beat-less step until the next `beat`.
 * Steps are read in `at` order, not array order, so authoring order in a
 * timeline can never change what plays.
 */
export function beatLabelAt(
  steps: ShowreelBeatStep[],
  timeMs: number,
): string | null {
  let active: string | null = null;
  for (const step of [...steps].sort((a, b) => a.at - b.at)) {
    if (step.at > timeMs) break;
    if (step.beat) active = step.beat;
  }
  return active;
}

/** The ordered list of beats a timeline plays, for tests and tooling. */
export function showreelBeats(steps: ShowreelBeatStep[]): ShowreelBeat[] {
  return [...steps]
    .sort((a, b) => a.at - b.at)
    .filter((step): step is ShowreelBeatStep & { beat: string } =>
      Boolean(step.beat),
    )
    .map((step) => ({ id: step.id, at: step.at, label: step.beat }));
}
