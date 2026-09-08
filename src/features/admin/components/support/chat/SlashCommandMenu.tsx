"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n";
import { pickLocalized } from "@/lib/i18n/pickLocalized";
import type { Locale } from "@/lib/i18n/LocaleProvider";
import { AdminInput } from "@/features/admin/ui";

export type CannedReply = {
  id: string;
  slash_key: string;
  title: string;
  body: string;
};

type RawCannedReply = {
  id: string;
  slash_key: string;
  title: string;
  title_ar?: string | null;
  body: string;
  body_ar?: string | null;
};

type Props = {
  open: boolean;
  query: string;
  /** Keyboard / typed-script locale — not the admin UI language. */
  contentLocale: Locale;
  onSelect: (reply: CannedReply) => void;
  selectedIndex: number;
  onSelectedIndexChange: (i: number) => void;
};

function localizeReply(r: RawCannedReply, locale: Locale): CannedReply {
  return {
    id: r.id,
    slash_key: r.slash_key,
    title: pickLocalized(locale, r.title, r.title_ar),
    body: pickLocalized(locale, r.body, r.body_ar),
  };
}

export function SlashCommandMenu({
  open,
  query,
  contentLocale,
  onSelect,
  selectedIndex,
  onSelectedIndexChange,
}: Props) {
  const t = useTranslations();
  const [replies, setReplies] = useState<RawCannedReply[]>([]);
  const [search, setSearch] = useState("");
  const [moreBelow, setMoreBelow] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const rtl = contentLocale === "ar";

  useEffect(() => {
    if (!open) return;
    void fetch("/api/v1/whatsapp/canned-replies")
      .then((r) => r.json())
      .then((d: { replies?: RawCannedReply[] }) => setReplies(d.replies ?? []))
      .catch(() => setReplies([]));
  }, [open]);

  useEffect(() => {
    if (open) setSearch(query);
  }, [open, query]);

  const localized = useMemo(
    () => replies.map((r) => localizeReply(r, contentLocale)),
    [contentLocale, replies],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return localized.filter((r) => {
      if (!q) return true;
      const raw = replies.find((x) => x.id === r.id);
      return (
        r.slash_key.includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.body.toLowerCase().includes(q) ||
        (raw?.title_ar ?? "").toLowerCase().includes(q) ||
        (raw?.title ?? "").toLowerCase().includes(q) ||
        (raw?.body_ar ?? "").toLowerCase().includes(q) ||
        (raw?.body ?? "").toLowerCase().includes(q)
      );
    });
  }, [search, localized, replies]);

  useEffect(() => {
    if (selectedIndex >= filtered.length) {
      onSelectedIndexChange(Math.max(0, filtered.length - 1));
    }
  }, [filtered.length, onSelectedIndexChange, selectedIndex]);

  function updateMoreBelow() {
    const el = listRef.current;
    if (!el) {
      setMoreBelow(false);
      return;
    }
    setMoreBelow(el.scrollHeight - el.scrollTop - el.clientHeight > 6);
  }

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(updateMoreBelow);
    return () => cancelAnimationFrame(id);
  }, [open, filtered.length, search]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const selected = listRef.current.querySelector(
      '[aria-selected="true"]',
    ) as HTMLElement | null;
    selected?.scrollIntoView({ block: "nearest" });
    updateMoreBelow();
  }, [open, selectedIndex, filtered.length]);

  if (!open) return null;

  return (
    <div
      dir={rtl ? "rtl" : "ltr"}
      className={cn(
        "absolute bottom-full z-20 mb-2 flex w-full max-w-md flex-col overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-lg",
        rtl ? "right-0" : "left-0",
      )}
      role="listbox"
      aria-label={t("admin.frontDesk.cannedTitle")}
    >
      <div className="shrink-0 border-b border-[#E5E7EB] p-2">
        <div className="relative">
          <Search
            className={cn(
              "pointer-events-none absolute top-1/2 size-3.5 -translate-y-1/2 text-[#9CA3AF]",
              rtl ? "right-2.5" : "left-2.5",
            )}
            aria-hidden
          />
          <AdminInput
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              onSelectedIndexChange(0);
            }}
            placeholder={t("admin.frontDesk.cannedSearch")}
            aria-label={t("admin.frontDesk.cannedSearch")}
            className={cn("h-8 text-xs", rtl ? "pr-8 pl-3" : "pl-8 pr-3")}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                onSelectedIndexChange(
                  Math.min(selectedIndex + 1, Math.max(0, filtered.length - 1)),
                );
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                onSelectedIndexChange(Math.max(0, selectedIndex - 1));
              } else if (e.key === "Enter" && filtered[selectedIndex]) {
                e.preventDefault();
                onSelect(filtered[selectedIndex]);
              }
            }}
          />
        </div>
      </div>

      <div className="relative min-h-0">
        <div
          ref={listRef}
          className="max-h-56 overflow-y-auto"
          onScroll={updateMoreBelow}
        >
          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-[#9CA3AF]">
              {t("admin.frontDesk.cannedNoMatch")}
            </p>
          ) : (
            filtered.map((r, i) => (
              <button
                key={r.id}
                type="button"
                role="option"
                aria-selected={i === selectedIndex}
                dir={rtl ? "rtl" : "ltr"}
                className={cn(
                  "flex w-full flex-col gap-0.5 px-3 py-2 text-sm hover:bg-[#F3F4F6]",
                  rtl ? "text-right" : "text-left",
                  i === selectedIndex && "bg-[#F3F4F6]",
                )}
                onMouseEnter={() => onSelectedIndexChange(i)}
                onClick={() => onSelect(r)}
              >
                <span className="font-medium text-[#111827]">
                  /{r.slash_key} · {r.title}
                </span>
                <span className="line-clamp-1 text-xs text-[#6B7280]">
                  {r.body}
                </span>
              </button>
            ))
          )}
        </div>

        {moreBelow ? (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center"
            aria-hidden
          >
            <div className="h-8 w-full bg-gradient-to-t from-white to-transparent" />
            <div className="flex w-full items-center justify-center gap-1 bg-white pb-1.5 text-[11px] font-medium text-[#6B7280]">
              <ChevronDown className="size-3.5" />
              {t("admin.frontDesk.cannedMore")}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function useSlashFiltered(query: string, replies: CannedReply[]) {
  return useMemo(() => {
    const q = query.toLowerCase();
    return replies.filter(
      (r) =>
        !q ||
        r.slash_key.includes(q) ||
        r.title.toLowerCase().includes(q),
    );
  }, [query, replies]);
}
