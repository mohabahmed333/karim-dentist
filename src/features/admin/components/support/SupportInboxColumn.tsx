"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bot, ChevronDown, Search, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n";
import type { AdminMessageKey } from "@/lib/i18n/messages/admin/en";
import { SupportAvatar } from "./SupportAvatar";
import { InboxMessagePreview } from "./chat/InboxMessagePreview";
import { CLINIC_ASSIST_CHAT_ID } from "./clinicAssistChat";
import type { SupportConversation } from "./supportDummyData";
import {
  UNREAD_BADGE_POP_MS,
  unreadBadgePopAnimate,
  unreadBadgePopTransition,
} from "./compactInboxMotion";

export type InboxStatusFilter = "open" | "archived" | "all";
export type InboxSort = "newest" | "unread" | "name";

type Props = {
  conversations: SupportConversation[];
  selectedId: string;
  onSelect: (id: string) => void;
  title?: string;
  openLabel?: string;
  filter?: InboxStatusFilter;
  onFilterChange?: (filter: InboxStatusFilter) => void;
  sort?: InboxSort;
  onSortChange?: (sort: InboxSort) => void;
  search?: string;
  onSearchChange?: (value: string) => void;
  compact?: boolean;
  onClose?: () => void;
  /** Fixed pixel width when the column is resizable (desktop inbox). */
  widthPx?: number;
};

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-3.5 w-3.5", className)}
      fill="currentColor"
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const SORT_KEYS: { value: InboxSort; key: AdminMessageKey }[] = [
  { value: "newest", key: "admin.frontDesk.sortNewest" },
  { value: "unread", key: "admin.frontDesk.sortUnread" },
  { value: "name", key: "admin.frontDesk.sortName" },
];

export function SupportInboxColumn({
  conversations,
  selectedId,
  onSelect,
  title,
  openLabel,
  filter = "open",
  onFilterChange,
  sort = "newest",
  onSortChange,
  search = "",
  onSearchChange,
  compact = false,
  onClose,
  widthPx,
}: Props) {
  const t = useTranslations();
  const reduced = useReducedMotion();
  const [searchOpen, setSearchOpen] = useState(Boolean(search));
  const [sortOpen, setSortOpen] = useState(false);
  const [poppingUnreadId, setPoppingUnreadId] = useState<string | null>(null);
  const popTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heading = title ?? t("admin.frontDesk.title");
  const openText = openLabel ?? t("admin.frontDesk.open");

  useEffect(() => {
    return () => {
      if (popTimerRef.current) clearTimeout(popTimerRef.current);
    };
  }, []);

  function selectConversation(id: string, unread?: string) {
    if (popTimerRef.current) {
      clearTimeout(popTimerRef.current);
      popTimerRef.current = null;
    }
    if (compact && unread && !reduced) {
      setPoppingUnreadId(id);
      popTimerRef.current = setTimeout(() => {
        popTimerRef.current = null;
        setPoppingUnreadId(null);
        onSelect(id);
      }, UNREAD_BADGE_POP_MS);
      return;
    }
    setPoppingUnreadId(null);
    onSelect(id);
  }

  const sortLabel = useMemo(() => {
    const key =
      SORT_KEYS.find((o) => o.value === sort)?.key ??
      "admin.frontDesk.sortNewest";
    return t(key);
  }, [sort, t]);

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 flex-col border-r border-[#E5E7EB] bg-white",
        compact
          ? "w-full min-w-0"
          : widthPx
            ? "shrink-0"
            : "w-[36%] min-w-[340px]",
      )}
      style={
        !compact && widthPx
          ? { width: widthPx, minWidth: widthPx, maxWidth: widthPx }
          : undefined
      }
    >
      <div className={cn("shrink-0 border-b border-[#E5E7EB]", compact ? "px-3 py-2.5" : "px-4 py-3")}>
        <div className="flex items-center justify-between gap-2">
          <h1
            className={cn(
              "font-bold text-[#111827]",
              compact ? "text-sm" : "text-base",
            )}
          >
            {heading}
          </h1>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              className={cn(
                "rounded-md p-1.5 text-[#6B7280] hover:bg-[#F3F4F6]",
                searchOpen && "bg-[#F3F4F6] text-[#111827]",
              )}
              aria-label={
                searchOpen
                  ? t("admin.frontDesk.hideSearch")
                  : t("admin.frontDesk.search")
              }
              aria-expanded={searchOpen}
              onClick={() => {
                setSearchOpen((v) => {
                  if (v) onSearchChange?.("");
                  return !v;
                });
              }}
            >
              {searchOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </button>
            {compact && onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="hidden rounded-md p-1.5 text-[#6B7280] hover:bg-[#F3F4F6] sm:inline-flex"
                aria-label={t("admin.frontDesk.closeBubble")}
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        {searchOpen ? (
          <input
            value={search}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={t("admin.frontDesk.searchPlaceholder")}
            className="mt-3 w-full rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-[#9CA3AF]"
            aria-label={t("admin.frontDesk.searchAria")}
            autoFocus
          />
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-md border border-[#E5E7EB]">
            <button
              type="button"
              onClick={() => onFilterChange?.("open")}
              className={cn(
                "px-2.5 py-1 text-xs font-medium",
                filter === "open"
                  ? "bg-[#111827] text-white"
                  : "bg-white text-[#374151] hover:bg-[#F9FAFB]",
              )}
            >
              {openText}
            </button>
            <button
              type="button"
              onClick={() => onFilterChange?.("archived")}
              className={cn(
                "border-l border-[#E5E7EB] px-2.5 py-1 text-xs font-medium",
                filter === "archived"
                  ? "bg-[#111827] text-white"
                  : "bg-white text-[#374151] hover:bg-[#F9FAFB]",
              )}
            >
              {t("admin.frontDesk.archived")}
            </button>
            <button
              type="button"
              onClick={() => onFilterChange?.("all")}
              className={cn(
                "border-l border-[#E5E7EB] px-2.5 py-1 text-xs font-medium",
                filter === "all"
                  ? "bg-[#111827] text-white"
                  : "bg-white text-[#374151] hover:bg-[#F9FAFB]",
              )}
            >
              {t("admin.frontDesk.all")}
            </button>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setSortOpen((v) => !v)}
              className="inline-flex items-center gap-1 rounded-md border border-[#E5E7EB] bg-white px-2.5 py-1 text-xs font-medium text-[#374151] hover:bg-[#F9FAFB]"
              aria-expanded={sortOpen}
              aria-haspopup="listbox"
            >
              {sortLabel}
              <ChevronDown className="h-3 w-3 text-[#9CA3AF]" />
            </button>
            {sortOpen ? (
              <div
                className="absolute left-0 z-20 mt-1 w-40 overflow-hidden rounded-md border border-[#E5E7EB] bg-white py-1 shadow-lg"
                role="listbox"
              >
                {SORT_KEYS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={sort === opt.value}
                    className={cn(
                      "flex w-full px-3 py-1.5 text-left text-xs hover:bg-[#F3F4F6]",
                      sort === opt.value
                        ? "font-semibold text-[#111827]"
                        : "text-[#374151]",
                    )}
                    onClick={() => {
                      onSortChange?.(opt.value);
                      setSortOpen(false);
                    }}
                  >
                    {t(opt.key)}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-[#9CA3AF]">
            {t("admin.frontDesk.noMatch")}
          </p>
        ) : null}
        {conversations.map((c) => {
          const active = c.id === selectedId;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => selectConversation(c.id, c.unread)}
              className={cn(
                "flex w-full gap-3.5 border-b border-[#E5E7EB] text-left transition-colors",
                compact ? "px-3 py-3" : "px-4 py-3.5",
                active ? "bg-[#F3F4F6]" : "bg-white hover:bg-[#F9FAFB]",
                c.id === CLINIC_ASSIST_CHAT_ID && "border-b-[#E0E7FF]",
              )}
            >
              {c.id === CLINIC_ASSIST_CHAT_ID ? (
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center justify-center rounded-full text-white",
                    compact ? "h-9 w-9" : "h-11 w-11",
                  )}
                  style={{ background: "var(--admin-primary)" }}
                >
                  <Bot className={compact ? "h-4 w-4" : "h-5 w-5"} aria-hidden />
                </span>
              ) : (
                <SupportAvatar
                  initials={c.initials}
                  color={c.avatarColor}
                  size={compact ? "md" : "lg"}
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={cn(
                      "truncate font-semibold text-[#111827]",
                      compact ? "text-sm" : "text-[15px]",
                    )}
                  >
                    {c.name}
                  </p>
                  <div
                    className={cn(
                      "flex shrink-0 items-center gap-1 text-[#6B7280]",
                      compact ? "text-[12px]" : "text-[13px]",
                    )}
                  >
                    {c.id === CLINIC_ASSIST_CHAT_ID ? (
                      <span className="rounded-full bg-[#EEF2FF] px-1.5 py-0.5 text-[10px] font-semibold text-[#4338CA]">
                        {t("admin.frontDesk.aiTag")}
                      </span>
                    ) : null}
                    {c.starred && c.id !== CLINIC_ASSIST_CHAT_ID ? (
                      <Star className="h-3.5 w-3.5 fill-[#FBBF24] text-[#FBBF24]" />
                    ) : null}
                    {c.whatsapp ? (
                      <span className="text-[#22C55E]">
                        <WhatsAppIcon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
                      </span>
                    ) : null}
                    {c.timestamp ? <span>{c.timestamp}</span> : null}
                  </div>
                </div>
                <InboxMessagePreview conversation={c} />
                <AnimatePresence initial={false}>
                  {c.unread ? (
                    <div className="mt-2 flex justify-end">
                      <motion.span
                        key={`${c.id}-unread`}
                        className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#374151] px-1.5 text-[11px] font-semibold text-white"
                        initial={false}
                        animate={
                          poppingUnreadId === c.id
                            ? unreadBadgePopAnimate
                            : { scale: 1, opacity: 1 }
                        }
                        transition={unreadBadgePopTransition(reduced)}
                      >
                        {c.unread}
                      </motion.span>
                    </div>
                  ) : null}
                </AnimatePresence>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
