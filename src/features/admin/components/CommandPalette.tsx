"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  CalendarDays,
  CornerDownLeft,
  FileText,
  Globe,
  LayoutGrid,
  MessagesSquare,
  Search,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import type { AdminMessageKey } from "@/lib/i18n/messages/admin/en";
import { cn } from "@/lib/utils";
import { adminPageLabelKeys } from "@/features/admin/lib/adminNav";
import {
  buildStaticCommandHits,
  commandPaletteGroups,
  filterCommandHits,
  pushRecentId,
  recentHits,
  type CommandDisplayGroup,
  type CommandHit,
  type CommandKind,
} from "@/features/admin/lib/commandPalette";
import { scoreCommandHit, shouldUseAiSearch } from "@/features/admin/lib/commandSearch";
import { mergeAiHitOrder } from "@/features/admin/lib/commandSearchExtract";
import {
  COMMAND_LAYOUT_ID,
  commandBackdropTransition,
  commandResultsTransition,
  commandShellTransition,
} from "@/features/admin/lib/commandPaletteMotion";
import { SECTION_LABEL_KEYS } from "@/features/customize/sectionRegistry";
import { isCustomizeSection } from "@/features/customize/types";
import { useOptionalQuickBook } from "@/features/admin/components/quick-book/QuickBookContext";
import {
  SHOWREEL_COMMAND_EVENT,
  dispatchShowreelNavigate,
  type ShowreelCommandDetail,
} from "@/features/portfolio/showreel/product-scenes/showreelAdminEvents";
import { COMMAND_SEARCH_FIXTURE } from "@/features/portfolio/showreel/product-scenes/fixtures/commandSearchFixtures";
import { ADMIN_CLOSE_COMMAND_EVENT } from "@/features/admin/lib/adminShellEvents";

const GROUP_KEYS: Record<CommandKind, AdminMessageKey> = {
  page: "admin.search.group.page",
  patient: "admin.search.group.patient",
  reservation: "admin.search.group.reservation",
  service: "admin.search.group.service",
  "case-study": "admin.search.group.case-study",
  project: "admin.search.group.project",
  thread: "admin.search.group.thread",
  section: "admin.search.group.section",
  public: "admin.search.group.public",
};

const KIND_ICON = {
  page: FileText,
  patient: User,
  reservation: CalendarDays,
  service: LayoutGrid,
  "case-study": FileText,
  project: FileText,
  thread: MessagesSquare,
  section: LayoutGrid,
  public: Globe,
} as const;

function shortcutLabel(): string {
  if (typeof navigator === "undefined") return "⌘K";
  return /Mac|iPhone|iPad/i.test(navigator.platform) ? "⌘K" : "Ctrl+K";
}

export function CommandPalette() {
  const t = useTranslations();
  const router = useRouter();
  const quickBook = useOptionalQuickBook();
  const reduced = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [dynamicHits, setDynamicHits] = useState<CommandHit[]>([]);
  const [resultsReady, setResultsReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [aiIds, setAiIds] = useState<string[]>([]);
  const [aiUsed, setAiUsed] = useState(false);
  const [demoLocked, setDemoLocked] = useState(false);

  const staticHits = useMemo(
    () =>
      buildStaticCommandHits({
        pageLabel: (href) => {
          const key = adminPageLabelKeys[href];
          return key ? t(key) : href;
        },
        customizeLabel: (section) =>
          isCustomizeSection(section) ? t(SECTION_LABEL_KEYS[section]) : section,
        publicHome: t("admin.search.home"),
        publicServices: t("admin.search.publicServices"),
        publicCaseStudies: t("admin.search.publicCaseStudies"),
        publicFeatured: t("admin.search.publicFeatured"),
        publicExperience: t("admin.search.publicExperience"),
        newReservation: t("admin.search.newReservation"),
      }),
    [t],
  );

  const allHits = useMemo(
    () => [...staticHits, ...dynamicHits],
    [dynamicHits, staticHits],
  );

  const localFiltered = useMemo(
    () => filterCommandHits(allHits, query),
    [allHits, query],
  );

  const filtered = useMemo(
    () =>
      aiIds.length > 0
        ? mergeAiHitOrder(allHits, localFiltered, aiIds)
        : localFiltered,
    [aiIds, allHits, localFiltered],
  );

  const recents = useMemo(
    () => (mounted ? recentHits(allHits, window.localStorage) : []),
    [allHits, mounted, open],
  );

  const groups = useMemo(
    (): CommandDisplayGroup[] => commandPaletteGroups(filtered, query, recents),
    [filtered, query, recents],
  );

  const flat = useMemo(() => groups.flatMap((group) => group.items), [groups]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
    setResultsReady(false);
    setAiIds([]);
    setAiUsed(false);
    setDemoLocked(false);
  }, []);

  const openPalette = useCallback(() => {
    setResultsReady(Boolean(reduced));
    setOpen(true);
    setActive(0);
  }, [reduced]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function onCloseCommand() {
      close();
    }
    window.addEventListener(ADMIN_CLOSE_COMMAND_EVENT, onCloseCommand);
    return () =>
      window.removeEventListener(ADMIN_CLOSE_COMMAND_EVENT, onCloseCommand);
  }, [close]);

  useEffect(() => {
    if (!open) return;
    if (demoLocked) return;
    const q = query.trim();
    if (!q) {
      setDynamicHits([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetch(`/api/admin/search?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      })
        .then((response) =>
          response.ok ? response.json() : { hits: [] as CommandHit[] },
        )
        .then((payload: { hits?: CommandHit[] }) => {
          setDynamicHits(Array.isArray(payload.hits) ? payload.hits : []);
        })
        .catch(() => undefined);
    }, 280);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [open, query, demoLocked]);

  useEffect(() => {
    setAiIds([]);
    setAiUsed(false);
    if (demoLocked) return;
    if (!open || !query.trim()) return;
    const best = Math.max(
      0,
      ...allHits.slice(0, 200).map((item) => scoreCommandHit(item, query)),
    );
    if (!shouldUseAiSearch(query, best, localFiltered.length)) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const seen = new Set<string>();
      const candidates: {
        id: string;
        kind: string;
        title: string;
        subtitle?: string;
      }[] = [];
      for (const item of [...localFiltered, ...allHits]) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        candidates.push({
          id: item.id,
          kind: item.kind,
          title: item.title,
          subtitle: item.subtitle,
        });
        if (candidates.length >= 80) break;
      }
      void fetch("/api/v1/ai/command-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ query, candidates }),
      })
        .then((response) => (response.ok ? response.json() : { ids: [] }))
        .then((payload: { ids?: string[] }) => {
          const ids = Array.isArray(payload.ids) ? payload.ids : [];
          if (ids.length === 0) return;
          setAiIds(ids);
          setAiUsed(true);
        })
        .catch(() => undefined);
    }, 280);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [allHits, demoLocked, localFiltered, open, query]);

  useEffect(() => {
    function onShowreel(event: Event) {
      const detail = (event as CustomEvent<ShowreelCommandDetail>).detail;
      if (!detail) return;
      if (detail.type === "open") {
        openPalette();
        return;
      }
      if (detail.type === "close") {
        close();
        setDemoLocked(false);
        return;
      }
      if (detail.type === "query") {
        setDemoLocked(true);
        setQuery(detail.query);
        setOpen(true);
        setResultsReady(true);
        setActive(0);
        return;
      }
      if (detail.type === "demo-hits" || detail.type === "seed-demo") {
        setDemoLocked(true);
        setOpen(true);
        setResultsReady(true);
        setAiUsed(true);
        const seed =
          detail.type === "demo-hits"
            ? detail.hits
            : COMMAND_SEARCH_FIXTURE.hits.map((hit) => ({
                id: hit.id,
                kind: hit.kind,
                title: hit.title,
                subtitle: hit.subtitle,
                href: hit.href ?? "#",
                keywords: hit.title,
              }));
        setDynamicHits(seed as CommandHit[]);
        setAiIds(seed.map((hit) => hit.id));
        setActive(0);
      }
    }
    window.addEventListener(SHOWREEL_COMMAND_EVENT, onShowreel);
    return () =>
      window.removeEventListener(SHOWREEL_COMMAND_EVENT, onShowreel);
  }, [close, openPalette]);

  useEffect(() => {
    function onKey(event: globalThis.KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (open) close();
        else openPalette();
        return;
      }
      if (event.key === "Escape" && open) {
        event.preventDefault();
        close();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, open, openPalette]);

  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(() => inputRef.current?.focus());
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.cancelAnimationFrame(id);
      document.body.style.overflow = prev;
    };
  }, [open]);

  function go(hit: CommandHit) {
    if (typeof window !== "undefined") {
      pushRecentId(hit.id, window.localStorage);
    }
    close();
    setDemoLocked(false);
    if (document.documentElement.dataset.showreelDemo === "1") {
      if (hit.href && hit.href !== "#") {
        dispatchShowreelNavigate({
          href: hit.href,
          title: hit.title,
          id: hit.id,
          kind: hit.kind,
        });
      }
      return;
    }
    if (demoLocked) return;
    if (hit.href === "action:quick-book") {
      quickBook?.openQuickBook();
      return;
    }
    if (hit.href === "#") return;
    router.push(hit.href);
  }

  function onInputKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((value) => Math.min(value + 1, Math.max(flat.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((value) => Math.max(value - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const hit = flat[active];
      if (hit) go(hit);
    }
  }

  const shellTransition = commandShellTransition(reduced);
  const shortcut = shortcutLabel();
  const showResults = open && (reduced || resultsReady);
  const activeHit = flat[active];

  const shellClass =
    "relative overflow-hidden bg-[var(--admin-canvas)] text-[var(--admin-text)]";

  const aiTag = (
    <span
      title={t("admin.search.ai")}
      aria-label={t("admin.search.ai")}
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center rounded-md",
        aiUsed
          ? "bg-[var(--admin-primary)] text-white"
          : "text-[var(--admin-muted)]",
      )}
    >
      <Sparkles className="size-3.5" aria-hidden />
    </span>
  );

  return (
    <>
      <div className="relative h-8 w-full">
        {!open ? (
          <motion.button
            type="button"
            layoutId={COMMAND_LAYOUT_ID}
            transition={shellTransition}
            onClick={openPalette}
            data-showreel-action="command-palette-open"
            aria-label={t("admin.search.open")}
            className={cn(
              shellClass,
              "flex h-8 w-full items-center justify-start gap-2 rounded-lg border border-[var(--admin-border)] px-2.5",
            )}
          >
            <Search className="size-3.5 shrink-0 text-[var(--admin-muted)]" />
            <span className="min-w-0 flex-1 truncate text-start text-[13px] text-[var(--admin-muted)]">
              {t("admin.search")}
            </span>
            {aiTag}
            <kbd className="hidden shrink-0 rounded-md bg-[var(--admin-panel)] px-1.5 py-0.5 text-[10px] text-[var(--admin-muted)] sm:inline">
              {shortcut}
            </kbd>
          </motion.button>
        ) : (
          <div className="h-8 w-full rounded-lg border border-transparent" aria-hidden />
        )}
      </div>

      {mounted
        ? createPortal(
            <AnimatePresence>
              {open ? (
                <>
                  <motion.button
                    key="cmdk-backdrop"
                    type="button"
                    aria-label={t("admin.search.close")}
                    className="fixed inset-0 z-[90] bg-[#111111]/20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, pointerEvents: "none" }}
                    transition={commandBackdropTransition(reduced)}
                    onClick={close}
                  />
                  <div className="pointer-events-none fixed inset-x-0 top-[4.25rem] z-[91] flex justify-center px-3">
                    <motion.div
                      key="cmdk-shell"
                      layoutId={COMMAND_LAYOUT_ID}
                      role="dialog"
                      aria-modal="true"
                      aria-label={t("admin.search")}
                      transition={shellTransition}
                      onLayoutAnimationComplete={() => setResultsReady(true)}
                      className={cn(
                        shellClass,
                        "pointer-events-auto relative z-[91] flex min-h-[20rem] w-[min(36rem,calc(100vw-1.5rem))] flex-col rounded-lg shadow-[0_18px_50px_rgba(15,23,42,0.14)]",
                      )}
                    >
                      <div className="flex items-center gap-2 border-b border-[var(--admin-border)] px-3 py-2.5">
                        <Search className="size-4 shrink-0 text-[var(--admin-muted)]" />
                        <input
                          ref={inputRef}
                          value={query}
                          data-showreel-action="command-palette-input"
                          onChange={(event) => {
                            setQuery(event.target.value);
                            setActive(0);
                          }}
                          onKeyDown={onInputKey}
                          placeholder={t("admin.search.hint")}
                          className="h-7 min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[var(--admin-muted)]"
                        />
                        {aiTag}
                        {query ? (
                          <button
                            type="button"
                            onClick={() => setQuery("")}
                            className="flex size-5 items-center justify-center rounded-md bg-[var(--admin-muted)] text-white"
                            aria-label={t("admin.close")}
                          >
                            <X className="size-3" />
                          </button>
                        ) : (
                          <CornerDownLeft className="size-3.5 text-[var(--admin-muted)]" />
                        )}
                      </div>
                      <motion.div
                        initial={reduced ? false : { opacity: 0, y: 8 }}
                        animate={
                          showResults ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }
                        }
                        transition={commandResultsTransition(reduced)}
                        className="max-h-[min(26rem,58vh)] overflow-y-auto py-2"
                      >
                        {flat.length === 0 ? (
                          <p className="px-4 py-8 text-center text-[13px] text-[var(--admin-muted)]">
                            {t("admin.search.empty")}
                          </p>
                        ) : (
                          groups.map((group, groupIndex) => (
                            <section key={`${group.kind}-${groupIndex}`}>
                              <div className="flex items-center gap-2 px-3 py-1.5">
                                <div className="h-px flex-1 bg-[var(--admin-border)]" />
                                <p className="text-[10px] font-medium tracking-wide text-[var(--admin-muted)] uppercase">
                                  {group.recent
                                    ? t("admin.search.recent")
                                    : t(GROUP_KEYS[group.kind])}
                                </p>
                                <div className="h-px flex-1 bg-[var(--admin-border)]" />
                              </div>
                              <ul>
                                {group.items.map((item) => {
                                  const Icon = KIND_ICON[item.kind];
                                  const selected = item.id === activeHit?.id;
                                  return (
                                    <li key={item.id}>
                                      <button
                                        type="button"
                                        data-showreel-action="command-hit"
                                        data-showreel-hit={item.id}
                                        onMouseEnter={() =>
                                          setActive(flat.findIndex((row) => row.id === item.id))
                                        }
                                        onClick={() => go(item)}
                                        className={cn(
                                          "flex w-full items-center gap-2.5 px-3 py-2 text-start text-[13px]",
                                          selected
                                            ? "bg-[var(--admin-hover)]"
                                            : "hover:bg-[var(--admin-hover)]",
                                        )}
                                      >
                                        <Icon className="size-4 shrink-0 text-[var(--admin-muted)]" />
                                        <span className="min-w-0 flex-1 truncate font-medium">
                                          {item.title}
                                        </span>
                                        {item.subtitle ? (
                                          <span className="hidden max-w-[40%] truncate text-[12px] text-[var(--admin-muted)] sm:inline">
                                            {item.subtitle}
                                          </span>
                                        ) : null}
                                      </button>
                                    </li>
                                  );
                                })}
                              </ul>
                            </section>
                          ))
                        )}
                      </motion.div>
                    </motion.div>
                  </div>
                </>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}
