"use client";

import { useEffect, useRef } from "react";
import type { PublicMediaItem } from "@/services/storage";
import { CheckIcon } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { mediaUrlsMatch } from "../lib/mediaUrlsMatch";
import { MediaLibraryGridSkeleton } from "./MediaLibraryGridSkeleton";

type Props = {
  items: PublicMediaItem[];
  selectedUrl: string | null;
  onSelect: (url: string) => void;
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
};

export function MediaLibraryGrid({
  items,
  selectedUrl,
  onSelect,
  loadingMore = false,
  hasMore = false,
  onLoadMore,
}: Props) {
  const t = useTranslations();
  const selectedRef = useRef<HTMLButtonElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
  }, [selectedUrl, items]);

  useEffect(() => {
    if (!hasMore || !onLoadMore) return;
    const node = sentinelRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) onLoadMore();
      },
      { root: node.parentElement, rootMargin: "80px", threshold: 0 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [hasMore, onLoadMore, items.length]);

  if (!items.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t("admin.customize.mediaLibraryEmpty")}
      </p>
    );
  }

  return (
    <div className="max-h-[min(55vh,420px)] overflow-y-auto overscroll-contain pr-0.5">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {items.map((item) => {
          const selected = mediaUrlsMatch(selectedUrl, item.url);
          return (
            <button
              key={`${item.bucket}/${item.path}`}
              ref={selected ? selectedRef : undefined}
              type="button"
              aria-pressed={selected}
              className={cn(
                "relative aspect-square w-full overflow-hidden rounded-md bg-black/[0.04] ring-1 ring-border transition hover:ring-foreground/40",
                selected &&
                  "ring-2 ring-[#0f2744] ring-offset-2 ring-offset-background",
              )}
              onClick={() => onSelect(item.url)}
              title={item.name}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt=""
                className="absolute inset-0 size-full object-cover"
                loading="lazy"
                decoding="async"
              />
              {selected ? (
                <span className="absolute end-1.5 top-1.5 inline-flex size-6 items-center justify-center rounded-full bg-[#0f2744] text-white shadow">
                  <CheckIcon className="size-3.5" strokeWidth={2.5} />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {hasMore ? <div ref={sentinelRef} className="h-4 w-full" /> : null}
      {loadingMore ? (
        <div className="mt-2">
          <MediaLibraryGridSkeleton count={4} />
        </div>
      ) : null}
    </div>
  );
}
