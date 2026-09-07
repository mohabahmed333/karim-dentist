export function nextAutoplayIndex(current: number, total: number): number {
  if (total <= 0) return 0;
  return (current + 1) % total;
}

/** How many copies of the slide list Embla needs for a seamless loop. */
export function loopCopiesForSlides(
  slideCount: number,
  minSlides = 12,
): number {
  if (slideCount <= 0) return 1;
  return Math.max(2, Math.ceil(minSlides / slideCount));
}

export function repeatForInfiniteLoop<T>(items: readonly T[], minSlides = 12): T[] {
  const copies = loopCopiesForSlides(items.length, minSlides);
  const out: T[] = [];
  for (let i = 0; i < copies; i += 1) out.push(...items);
  return out;
}
