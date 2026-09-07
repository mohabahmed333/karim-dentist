export const CAROUSEL_NEAR_END_THRESHOLD = 0.82;

export function isNearCarouselEnd(
  progress: number,
  canScrollNext: boolean,
  threshold = CAROUSEL_NEAR_END_THRESHOLD,
): boolean {
  return progress >= threshold || !canScrollNext;
}

export function shouldFireNearEnd(
  locked: boolean,
  progress: number,
  canScrollNext: boolean,
  threshold = CAROUSEL_NEAR_END_THRESHOLD,
): boolean {
  if (locked) return false;
  return isNearCarouselEnd(progress, canScrollNext, threshold);
}
