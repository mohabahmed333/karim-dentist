export const INDEX_PAGE_SIZE = 6;

export function initialVisibleCount(total: number, pageSize: number): number {
  if (total <= 0) return 0;
  return Math.min(total, pageSize);
}

export function nextVisibleCount(
  current: number,
  total: number,
  pageSize: number,
): number {
  return Math.min(total, current + pageSize);
}

export function visibleItems<T>(
  items: readonly T[],
  visibleCount: number,
  enabled: boolean,
): T[] {
  if (!enabled) return [...items];
  return items.slice(0, visibleCount);
}

export function hasMoreItems(
  visibleCount: number,
  total: number,
  enabled: boolean,
): boolean {
  return enabled && visibleCount < total;
}

export function pagesNeeded(total: number, pageSize: number): number {
  if (total <= 0 || pageSize <= 0) return 0;
  return Math.ceil(total / pageSize);
}
