export const SCROLL_HIDE_TOP_REVEAL_PX = 32;
export const SCROLL_HIDE_DELTA_PX = 8;

export function applyScrollDirectionHide(
  el: HTMLElement,
  y: number,
  lastY: number,
  paused: boolean,
): number {
  if (paused) {
    el.classList.remove("is-scroll-hidden");
    return y;
  }

  const delta = y - lastY;

  if (y <= SCROLL_HIDE_TOP_REVEAL_PX) {
    el.classList.remove("is-scroll-hidden");
  } else if (delta > SCROLL_HIDE_DELTA_PX) {
    el.classList.add("is-scroll-hidden");
  } else if (delta < -SCROLL_HIDE_DELTA_PX) {
    el.classList.remove("is-scroll-hidden");
  }

  return y;
}
