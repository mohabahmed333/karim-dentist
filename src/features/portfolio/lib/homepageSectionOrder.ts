export const HOMEPAGE_SECTION_KEYS = [
  "about",
  "services",
  "gallery",
  "slider",
  "case-studies",
  "featured",
  "faq",
  "contact",
] as const;

export type HomepageSectionKey = (typeof HOMEPAGE_SECTION_KEYS)[number];

export type HideableSectionKey = HomepageSectionKey;

export const DEFAULT_HOMEPAGE_SECTION_ORDER: HomepageSectionKey[] = [
  ...HOMEPAGE_SECTION_KEYS,
];

export const HOMEPAGE_SECTION_LABELS: Record<HomepageSectionKey, string> = {
  about: "About",
  services: "Services",
  gallery: "Successful Cases",
  slider: "More Images",
  "case-studies": "Case studies",
  featured: "Projects",
  faq: "FAQ",
  contact: "Contact",
};

export function isHomepageSectionKey(value: string): value is HomepageSectionKey {
  return (HOMEPAGE_SECTION_KEYS as readonly string[]).includes(value);
}

export function isHideableSectionKey(value: string): value is HideableSectionKey {
  return isHomepageSectionKey(value);
}

/** Dedupe saved keys, then insert any missing ones in default order. */
export function normalizeHomepageSectionOrder(
  order: string[] | null | undefined,
): HomepageSectionKey[] {
  const seen = new Set<string>();
  const next: HomepageSectionKey[] = [];
  for (const key of order ?? []) {
    if (!isHomepageSectionKey(key) || seen.has(key)) continue;
    next.push(key);
    seen.add(key);
  }
  for (const key of HOMEPAGE_SECTION_KEYS) {
    if (seen.has(key)) continue;
    const defaultIndex = HOMEPAGE_SECTION_KEYS.indexOf(key);
    let insertAt = next.length;
    for (let i = defaultIndex + 1; i < HOMEPAGE_SECTION_KEYS.length; i += 1) {
      const later = HOMEPAGE_SECTION_KEYS[i];
      if (!later) continue;
      const found = next.indexOf(later);
      if (found >= 0) {
        insertAt = found;
        break;
      }
    }
    next.splice(insertAt, 0, key);
    seen.add(key);
  }
  return next;
}

export function getVisibleHomepageSections(
  order: string[] | null | undefined,
  hidden: string[] | null | undefined,
): HomepageSectionKey[] {
  const hiddenSet = new Set(hidden ?? []);
  return normalizeHomepageSectionOrder(order).filter((key) => !hiddenSet.has(key));
}

export function toggleHomepageSectionHidden(
  hidden: string[] | null | undefined,
  key: HideableSectionKey,
): string[] {
  const next = new Set(hidden ?? []);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return Array.from(next);
}

export function isHomepageSectionHidden(
  hidden: string[] | null | undefined,
  key: HideableSectionKey,
): boolean {
  return (hidden ?? []).includes(key);
}

export function moveHomepageSection(
  order: HomepageSectionKey[],
  fromIndex: number,
  toIndex: number,
): HomepageSectionKey[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= order.length ||
    toIndex >= order.length
  ) {
    return order;
  }
  const next = [...order];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}
