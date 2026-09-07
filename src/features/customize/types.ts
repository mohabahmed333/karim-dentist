export const CUSTOMIZE_SECTIONS = [
  "hero",
  "about",
  "services",
  "gallery",
  "slider",
  "contact",
  "case-studies",
  "footer",
  "settings",
] as const;

export type CustomizeSection = (typeof CUSTOMIZE_SECTIONS)[number];

export type SaveStatus = "saved" | "unsaved" | "saving" | "error";

export const COLLECTION_SECTIONS = [
  "case-studies",
  "services",
  "slider",
  "footer",
] as const;

export type CollectionSection = (typeof COLLECTION_SECTIONS)[number];

export function isCustomizeSection(value: string): value is CustomizeSection {
  return (CUSTOMIZE_SECTIONS as readonly string[]).includes(value);
}

export function isCollectionSection(
  value: string,
): value is CollectionSection {
  return (COLLECTION_SECTIONS as readonly string[]).includes(value);
}
