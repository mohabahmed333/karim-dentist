"use client";

import { AdminSkeleton as Block } from "@/features/admin/components/AdminSkeleton";
import { useTranslations } from "@/lib/i18n";

export function MediaLibraryGridSkeleton({ count = 12 }: { count?: number }) {
  const t = useTranslations();
  return (
    <div
      className="grid max-h-[min(55vh,420px)] grid-cols-3 gap-2 overflow-hidden sm:grid-cols-4"
      aria-busy="true"
      aria-label={t("admin.customize.mediaLibraryLoading")}
    >
      {Array.from({ length: count }, (_, i) => (
        <Block key={i} className="aspect-square w-full rounded-md" />
      ))}
    </div>
  );
}
