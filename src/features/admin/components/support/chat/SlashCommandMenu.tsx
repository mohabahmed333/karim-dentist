"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "@/lib/i18n";
import { pickLocalized } from "@/lib/i18n/pickLocalized";
import type { Locale } from "@/lib/i18n/LocaleProvider";

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
  onSelect,
  selectedIndex,
  onSelectedIndexChange,
}: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  const [replies, setReplies] = useState<RawCannedReply[]>([]);

  useEffect(() => {
    if (!open) return;
    void fetch("/api/v1/whatsapp/canned-replies")
      .then((r) => r.json())
      .then((d: { replies?: RawCannedReply[] }) => setReplies(d.replies ?? []))
      .catch(() => setReplies([]));
  }, [open]);

  const localized = useMemo(
    () => replies.map((r) => localizeReply(r, locale)),
    [locale, replies],
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return localized.filter((r) => {
      if (!q) return true;
      const raw = replies.find((x) => x.id === r.id);
      return (
        r.slash_key.includes(q) ||
        r.title.toLowerCase().includes(q) ||
        (raw?.title_ar ?? "").toLowerCase().includes(q) ||
        (raw?.title ?? "").toLowerCase().includes(q)
      );
    });
  }, [query, localized, replies]);

  useEffect(() => {
    if (selectedIndex >= filtered.length) {
      onSelectedIndexChange(Math.max(0, filtered.length - 1));
    }
  }, [filtered.length, onSelectedIndexChange, selectedIndex]);

  if (!open || filtered.length === 0) return null;

  return (
    <div
      className="absolute bottom-full left-0 z-20 mb-2 w-full max-w-md overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-lg"
      role="listbox"
      aria-label={t("admin.frontDesk.cannedTitle")}
    >
      {filtered.map((r, i) => (
        <button
          key={r.id}
          type="button"
          role="option"
          aria-selected={i === selectedIndex}
          dir={locale === "ar" ? "rtl" : "ltr"}
          className={cn(
            "flex w-full flex-col gap-0.5 px-3 py-2 text-sm hover:bg-[#F3F4F6]",
            locale === "ar" ? "text-right" : "text-left",
            i === selectedIndex && "bg-[#F3F4F6]",
          )}
          onMouseEnter={() => onSelectedIndexChange(i)}
          onClick={() => onSelect(r)}
        >
          <span className="font-medium text-[#111827]">
            /{r.slash_key} · {r.title}
          </span>
          <span className="line-clamp-1 text-xs text-[#6B7280]">{r.body}</span>
        </button>
      ))}
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
