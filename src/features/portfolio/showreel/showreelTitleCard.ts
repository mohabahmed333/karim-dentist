/** Full-screen text beat before each feature demo. */
export const SHOWREEL_TITLE_CARD_MS = 1800;

/** Hold the card while the slide is active before play, then for `cardMs`. */
export function isFeatureTitleCardVisible(
  active: boolean,
  playing: boolean,
  elapsedMs: number,
  cardMs = SHOWREEL_TITLE_CARD_MS,
): boolean {
  if (!active) return false;
  if (!playing) return true;
  return elapsedMs < cardMs;
}

/** Scripts / scroll / product activate only after the card finishes. */
export function isFeatureDemoLive(
  active: boolean,
  playing: boolean,
  titleCardDone: boolean,
): boolean {
  return active && playing && titleCardDone;
}
