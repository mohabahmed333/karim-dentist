"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  List,
  Search,
  X,
} from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { SupportMessage } from "../supportDummyData";
import { findMessageMatches } from "./messageSearch";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: SupportMessage[];
  onJump: (messageId: string) => void;
};

export function ChatThreadSearch({
  open,
  onOpenChange,
  messages,
  onJump,
}: Props) {
  const t = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [resultsOpen, setResultsOpen] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  /** True after the user has explicitly jumped for the current query. */
  const hasJumpedRef = useRef(false);

  const hits = useMemo(
    () => findMessageMatches(messages, query),
    [messages, query],
  );

  const safeIndex =
    hits.length === 0 ? 0 : Math.min(activeIndex, hits.length - 1);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    hasJumpedRef.current = false;
    setResultsOpen(true);
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
    hasJumpedRef.current = false;
  }, [query]);

  function close() {
    onOpenChange(false);
  }

  function jumpToIndex(index: number) {
    if (hits.length === 0) return;
    const next = ((index % hits.length) + hits.length) % hits.length;
    setActiveIndex(next);
    hasJumpedRef.current = true;
    onJump(hits[next]!.id);
  }

  /** Prev/next / Enter — scroll only on explicit navigation. */
  function go(delta: number) {
    if (hits.length === 0) return;
    if (!hasJumpedRef.current) {
      jumpToIndex(safeIndex);
      return;
    }
    jumpToIndex(safeIndex + delta);
  }

  if (!open) return null;

  const countLabel =
    hits.length === 0
      ? t("admin.frontDesk.searchNoMatches")
      : t("admin.frontDesk.searchMatchCount")
          .replace("{current}", String(safeIndex + 1))
          .replace("{total}", String(hits.length));

  return (
    <div className="shrink-0 border-b border-[#E5E7EB] bg-white">
      <div className="flex items-center gap-1.5 px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-[#9CA3AF]" aria-hidden />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              close();
              return;
            }
            if (e.key === "Enter") {
              e.preventDefault();
              go(e.shiftKey ? -1 : 1);
            }
          }}
          placeholder={t("admin.frontDesk.searchMessagesPlaceholder")}
          aria-label={t("admin.frontDesk.searchMessagesAria")}
          aria-controls={resultsOpen ? listId : undefined}
          className="min-w-0 flex-1 bg-transparent text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF]"
        />
        <span className="shrink-0 tabular-nums text-[11px] text-[#6B7280]">
          {query.trim() ? countLabel : null}
        </span>
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={hits.length === 0}
          className="rounded-md p-1.5 text-[#6B7280] hover:bg-[#F3F4F6] disabled:opacity-40"
          aria-label={t("admin.frontDesk.searchPrev")}
        >
          <ChevronUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={hits.length === 0}
          className="rounded-md p-1.5 text-[#6B7280] hover:bg-[#F3F4F6] disabled:opacity-40"
          aria-label={t("admin.frontDesk.searchNext")}
        >
          <ChevronDown className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setResultsOpen((v) => !v)}
          className={cn(
            "rounded-md p-1.5 text-[#6B7280] hover:bg-[#F3F4F6]",
            resultsOpen && "bg-[#F3F4F6] text-[#111827]",
          )}
          aria-expanded={resultsOpen}
          aria-label={
            resultsOpen
              ? t("admin.frontDesk.searchHideResults")
              : t("admin.frontDesk.searchShowResults")
          }
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={close}
          className="rounded-md p-1.5 text-[#6B7280] hover:bg-[#F3F4F6]"
          aria-label={t("admin.frontDesk.hideMessageSearch")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {resultsOpen && query.trim() ? (
        <ul
          id={listId}
          className="max-h-44 overflow-y-auto border-t border-[#F3F4F6]"
          role="listbox"
          aria-label={t("admin.frontDesk.searchMessages")}
        >
          {hits.length === 0 ? (
            <li className="px-4 py-3 text-center text-xs text-[#9CA3AF]">
              {t("admin.frontDesk.searchNoMatches")}
            </li>
          ) : (
            hits.map((hit, index) => {
              const selected = index === safeIndex;
              return (
                <li key={hit.id} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    onClick={() => jumpToIndex(index)}
                    className={cn(
                      "flex w-full flex-col gap-0.5 px-4 py-2.5 text-start hover:bg-[#F9FAFB]",
                      selected && "bg-[#EEF2FF]",
                    )}
                  >
                    <span className="flex items-center justify-between gap-2 text-[11px] text-[#6B7280]">
                      <span className="truncate font-medium text-[#374151]">
                        {hit.authorName}
                      </span>
                      <span className="shrink-0 tabular-nums">{hit.time}</span>
                    </span>
                    <span className="line-clamp-2 text-xs text-[#111827]">
                      {hit.snippet}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
