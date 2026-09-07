import type { StorageBucket } from "@/lib/supabase/upload";

/** Public CMS media buckets (excludes patient-records). */
export const MEDIA_LIBRARY_BUCKETS = [
  "hero",
  "about",
  "projects",
  "clients",
] as const satisfies readonly StorageBucket[];

export type MediaLibrarySection = "all" | (typeof MEDIA_LIBRARY_BUCKETS)[number];

export const MEDIA_LIBRARY_SECTIONS: readonly MediaLibrarySection[] = [
  "all",
  ...MEDIA_LIBRARY_BUCKETS,
] as const;

export function bucketsForMediaSection(
  section: MediaLibrarySection,
): readonly StorageBucket[] {
  if (section === "all") return MEDIA_LIBRARY_BUCKETS;
  return [section];
}

export function mediaSectionFromBucket(
  bucket: StorageBucket | null | undefined,
): MediaLibrarySection {
  if (
    bucket &&
    (MEDIA_LIBRARY_BUCKETS as readonly string[]).includes(bucket)
  ) {
    return bucket as MediaLibrarySection;
  }
  return "all";
}
