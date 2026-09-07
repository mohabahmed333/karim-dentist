"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagesIcon, UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslations } from "@/lib/i18n";
import type { StorageBucket } from "@/lib/supabase/upload";
import {
  initialMediaCursor,
  listPublicMediaPage,
  type PublicMediaCursor,
  type PublicMediaItem,
} from "@/services/storage";
import {
  bucketsForMediaSection,
  mediaSectionFromBucket,
  type MediaLibrarySection,
} from "../lib/mediaLibrarySections";
import { mediaUrlsMatch } from "../lib/mediaUrlsMatch";
import { MediaLibraryGrid } from "./MediaLibraryGrid";
import { MediaLibraryGridSkeleton } from "./MediaLibraryGridSkeleton";
import { MediaLibrarySectionTabs } from "./MediaLibrarySectionTabs";
import { MediaLibraryUploadPane } from "./MediaLibraryUploadPane";

type Mode = "library" | "upload";

type Props = {
  open: boolean;
  busy?: boolean;
  currentUrl?: string | null;
  defaultBucket?: StorageBucket | null;
  onOpenChange: (open: boolean) => void;
  onSelectExisting: (url: string) => void;
  onPickFile: (file: File) => void;
};

const PAGE_SIZE = 24;

export function MediaLibraryDialog({
  open,
  busy = false,
  currentUrl = null,
  defaultBucket = null,
  onOpenChange,
  onSelectExisting,
  onPickFile,
}: Props) {
  const t = useTranslations();
  const [mode, setMode] = useState<Mode>("library");
  const [section, setSection] = useState<MediaLibrarySection>(() =>
    mediaSectionFromBucket(defaultBucket),
  );
  const [items, setItems] = useState<PublicMediaItem[]>([]);
  const [cursor, setCursor] = useState<PublicMediaCursor | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const fetchLock = useRef(false);
  const requestId = useRef(0);

  const loadPage = useCallback(
    async (
      from: PublicMediaCursor | null,
      append: boolean,
      forSection: MediaLibrarySection,
    ) => {
      if (fetchLock.current && append) return;
      const id = ++requestId.current;
      fetchLock.current = true;
      if (append) setLoadingMore(true);
      setError(null);
      try {
        const page = await listPublicMediaPage({
          cursor: from,
          limit: PAGE_SIZE,
          buckets: bucketsForMediaSection(forSection),
        });
        if (id !== requestId.current) return;
        setItems((prev) => (append ? [...prev, ...page.items] : page.items));
        setCursor(page.nextCursor);
        if (!append) {
          const match = currentUrl
            ? page.items.find((item) => mediaUrlsMatch(item.url, currentUrl))
            : undefined;
          setSelected(match?.url ?? null);
          setHasLoaded(true);
        }
      } catch (err) {
        if (id !== requestId.current) return;
        setError(
          err instanceof Error
            ? err.message
            : t("admin.customize.mediaLibraryLoadFailed"),
        );
        if (!append) {
          setHasLoaded(true);
          setCursor(null);
        }
      } finally {
        if (id === requestId.current) {
          fetchLock.current = false;
          setLoadingMore(false);
        }
      }
    },
    [currentUrl, t],
  );

  useEffect(() => {
    if (!open) return;
    const next = mediaSectionFromBucket(defaultBucket);
    setMode("library");
    setSection(next);
    setSelected(null);
    setError(null);
    setItems([]);
    setHasLoaded(false);
    setCursor(initialMediaCursor());
    fetchLock.current = false;
    void loadPage(initialMediaCursor(), false, next);
  }, [open, defaultBucket, loadPage]);

  function onSectionChange(next: MediaLibrarySection) {
    if (next === section) return;
    setSection(next);
    setItems([]);
    setHasLoaded(false);
    setCursor(initialMediaCursor());
    setError(null);
    fetchLock.current = false;
    void loadPage(initialMediaCursor(), false, next);
  }

  const onLoadMore = useCallback(() => {
    if (!cursor || !hasLoaded || loadingMore) return;
    void loadPage(cursor, true, section);
  }, [cursor, hasLoaded, loadPage, loadingMore, section]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[min(90vh,720px)] flex-col gap-3 overflow-hidden sm:max-w-3xl"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle>{t("admin.customize.mediaLibraryTitle")}</DialogTitle>
        </DialogHeader>
        <p className="text-[11px] text-muted-foreground">
          {t("admin.customize.mediaPasteHint")}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={mode === "library" ? "default" : "outline"}
            onClick={() => setMode("library")}
          >
            <ImagesIcon className="size-3.5" />
            {t("admin.customize.mediaLibraryTab")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "upload" ? "default" : "outline"}
            onClick={() => setMode("upload")}
          >
            <UploadIcon className="size-3.5" />
            {t("admin.customize.mediaUploadTab")}
          </Button>
        </div>
        {mode === "library" ? (
          <MediaLibrarySectionTabs value={section} onChange={onSectionChange} />
        ) : null}
        <div className="min-h-0 flex-1">
          {mode === "library" ? (
            !hasLoaded ? (
              <MediaLibraryGridSkeleton />
            ) : (
              <MediaLibraryGrid
                items={items}
                selectedUrl={selected}
                onSelect={setSelected}
                loadingMore={loadingMore}
                hasMore={Boolean(cursor)}
                onLoadMore={onLoadMore}
              />
            )
          ) : (
            <MediaLibraryUploadPane busy={busy} onPickFile={onPickFile} />
          )}
        </div>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        {mode === "library" ? (
          <DialogFooter className="shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("admin.customize.cancel")}
            </Button>
            <Button
              type="button"
              disabled={!selected || busy}
              onClick={() => {
                if (selected) onSelectExisting(selected);
              }}
            >
              {t("admin.customize.useSelectedImage")}
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
