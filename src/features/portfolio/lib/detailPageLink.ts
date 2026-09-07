type SlugItem = { id: string; slug: string | null | undefined };

export function toDetailPageIdSet(
  ids: readonly string[] | undefined,
): Set<string> {
  return new Set(ids ?? []);
}

export function featuredDetailHref(
  item: SlugItem,
  detailPageIds: Set<string>,
  previewMode?: boolean,
): string | null {
  if (previewMode) return null;
  if (!item.slug?.trim()) return null;
  if (!detailPageIds.has(item.id)) return null;
  return `/featured/${item.slug}`;
}

export function caseStudyDetailHref(
  item: SlugItem,
  detailPageIds: Set<string>,
  previewMode?: boolean,
): string | null {
  if (previewMode) return null;
  if (!item.slug?.trim()) return null;
  if (!detailPageIds.has(item.id)) return null;
  return `/case-studies/${item.slug}`;
}

export function collectFeaturedDetailPageIds(
  items: SlugItem[],
  _sectionsById?: Record<string, unknown[]>,
): string[] {
  return items
    .filter((item) => Boolean(item.slug?.trim()))
    .map((item) => item.id);
}

export function collectCaseStudyDetailPageIds(
  items: SlugItem[],
  _sectionsById?: Record<string, unknown[]>,
): string[] {
  return items
    .filter((item) => Boolean(item.slug?.trim()))
    .map((item) => item.id);
}
