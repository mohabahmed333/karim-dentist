"use client";

import { useTranslations } from "@/lib/i18n";

/** Visible on white dialogs — `bg-muted` is white in this theme / portal. */
export function MediaLibraryGridSkeleton({ count = 12 }: { count?: number }) {
  const t = useTranslations();
  return (
    <div
      className="grid max-h-[min(55vh,420px)] grid-cols-3 gap-2 overflow-hidden sm:grid-cols-4"
      aria-busy="true"
      aria-label={t("admin.customize.mediaLibraryLoading")}
    >
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="aspect-square w-full animate-pulse rounded-md bg-black/[0.08] ring-1 ring-black/5"
        />
      ))}
    </div>
  );
}
