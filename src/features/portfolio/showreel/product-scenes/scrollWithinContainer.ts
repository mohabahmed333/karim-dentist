/**
 * Scroll helpers that confine movement to one container.
 *
 * Element.scrollIntoView() scrolls EVERY scrollable ancestor up to the
 * document, so calling it inside a demo scene shifts the whole scene (and
 * with it the scripted cursor's frame of reference). These scroll only the
 * nearest scrolling ancestor instead.
 */

/** Clamped scrollTop that centres an element inside its scroll container. */
export function centeredScrollTop(
  elementOffsetTop: number,
  elementHeight: number,
  containerHeight: number,
  maxScrollTop: number,
): number {
  const target = elementOffsetTop - (containerHeight - elementHeight) / 2;
  const limit = Math.max(0, maxScrollTop);
  return Math.max(0, Math.min(target, limit));
}

/** Nearest ancestor that actually scrolls vertically, or null. */
export function findScrollableAncestor(el: Element | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node) {
    const overflowY = getComputedStyle(node).overflowY;
    const scrolls = overflowY === "auto" || overflowY === "scroll";
    if (scrolls && node.scrollHeight > node.clientHeight) return node;
    node = node.parentElement;
  }
  return null;
}

/** Centre `el` inside its own scroll container, leaving the page alone. */
export function scrollIntoContainerView(
  el: Element,
  behavior: ScrollBehavior = "smooth",
): void {
  const container = findScrollableAncestor(el);
  if (!container) return;
  const elRect = el.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const offsetTop = elRect.top - containerRect.top + container.scrollTop;
  const top = centeredScrollTop(
    offsetTop,
    elRect.height,
    container.clientHeight,
    container.scrollHeight - container.clientHeight,
  );
  container.scrollTo({ top, behavior });
}

/** Pin a scroll container to its bottom (newest message), page untouched. */
export function scrollContainerToBottom(
  container: HTMLElement | null,
  behavior: ScrollBehavior = "smooth",
): void {
  if (!container) return;
  container.scrollTo({ top: container.scrollHeight, behavior });
}
