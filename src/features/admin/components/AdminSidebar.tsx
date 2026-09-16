"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FolderOpen } from "lucide-react";
import {
  adminNavSections,
  filterAdminNavSections,
  findActiveAdminNavGroupIds,
  selectStarredNavItems,
} from "@/features/admin/lib/adminNav";
import { useAdminUiStore } from "@/features/admin/stores/adminUiStore";
import { useTranslations } from "@/lib/i18n";
import { AdminNavSectionBlock } from "./AdminNavSectionBlock";

type Props = {
  navBadges?: Record<string, number>;
  mobile?: boolean;
  /** Omit to show every section unfiltered (e.g. showreel demos with no session). */
  permissions?: string[] | null;
};

export function AdminSidebar({
  navBadges = {},
  mobile = false,
  permissions,
}: Props) {
  const t = useTranslations();
  const pathname = usePathname();
  // Stable across this component's own re-renders (toggling a group, starring
  // an item) so the "Starred" section's props don't churn identity on every
  // unrelated state change — Framer Motion's height:auto measurement for that
  // section got stuck at 0 under exactly that churn once several groups were
  // open at once, permanently hiding the pinned section.
  const sections = useMemo(
    () => filterAdminNavSections(adminNavSections, permissions ? new Set(permissions) : null),
    [permissions],
  );
  const starredHrefs = useAdminUiStore((state) => state.starredHrefs);
  const starredItems = useMemo(
    () => selectStarredNavItems(sections, starredHrefs),
    [sections, starredHrefs],
  );

  // Starring a page pins it into a new section at the very top of the
  // sidebar — but with several groups expanded and the list scrolled down,
  // that section renders above the current scroll position, out of view.
  // Scroll back to the top so the pinned item is actually visible right
  // after the star click that added it (not on unstar, which doesn't need it).
  const scrollRef = useRef<HTMLElement>(null);
  const prevStarredCountRef = useRef(starredHrefs.length);
  useEffect(() => {
    if (starredHrefs.length > prevStarredCountRef.current) {
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
    prevStarredCountRef.current = starredHrefs.length;
  }, [starredHrefs]);

  // Every group/sub-group on the path to the current page auto-opens; a
  // manual click can open/close others on top of that until the route
  // changes, when the whole set is recomputed fresh from scratch (not
  // accumulated forever — a group closes again once you navigate away from
  // it and don't reopen it).
  //
  // Adjusted during render rather than in an effect — React's documented
  // pattern for "reset state when a prop changes" — so the old set never
  // has a chance to paint open on the new page.
  const activeGroupIds = useMemo(
    () => findActiveAdminNavGroupIds(sections, pathname),
    [sections, pathname],
  );

  // Manually-opened groups survive a hard refresh (same page) by mirroring
  // into the shared, localStorage-backed UI store. A real in-app navigation
  // still resets to just the new page's active groups, same as before —
  // this only restores what was open a moment ago on *this* page.
  const persistedOpenGroupIds = useAdminUiStore((state) => state.openGroupIds);
  const setPersistedOpenGroupIds = useAdminUiStore((state) => state.setOpenGroupIds);
  const hasHydrated = useAdminUiStore((state) => state.hasHydrated);

  const [openGroupIds, setOpenGroupIds] = useState(activeGroupIds);
  const [renderedForPathname, setRenderedForPathname] = useState(pathname);
  const [mergedPersisted, setMergedPersisted] = useState(false);
  if (pathname !== renderedForPathname) {
    setRenderedForPathname(pathname);
    setOpenGroupIds(activeGroupIds);
    setMergedPersisted(false);
  } else if (hasHydrated && !mergedPersisted) {
    setMergedPersisted(true);
    setOpenGroupIds(new Set([...activeGroupIds, ...persistedOpenGroupIds]));
  }

  useEffect(() => {
    setPersistedOpenGroupIds([...openGroupIds]);
  }, [openGroupIds, setPersistedOpenGroupIds]);

  function toggleGroup(groupId: string) {
    setOpenGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }

  return (
    <aside
      ref={scrollRef}
      // The floating notes panel is `position: fixed; z-index: 40` and can sit
      // anywhere, including on top of the sidebar — a positioned z-index above
      // it wins the stacking order so sidebar clicks (including the star
      // toggle) never get swallowed by the panel. Below dialogs (z-50).
      className="relative z-45 flex h-full w-[220px] shrink-0 flex-col overflow-y-auto bg-[var(--admin-canvas)] px-2.5 py-3"
    >
      <div className="mb-4 px-2">
        <p className="text-[13px] font-semibold tracking-tight text-[var(--admin-text)]">
          {t("admin.brand")}
        </p>
        <p className="text-[11px] text-[var(--admin-muted)]">
          {t("admin.clinicWorkspace")}
        </p>
      </div>
      {/* The whole section grows in when the first item is starred, and
          collapses away when the last one is unstarred — the section itself
          is what visibly reacts to the star toggle, not just its icon. */}
      <AnimatePresence initial={false}>
        {starredItems.length > 0 ? (
          <motion.div
            key="starred-section"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <AdminNavSectionBlock
              section={{ id: "starred", titleKey: "admin.nav.starred", entries: starredItems }}
              navBadges={navBadges}
              openGroupIds={openGroupIds}
              onToggleGroup={toggleGroup}
              isFirst
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
      {sections.map((section, index) => (
        <AdminNavSectionBlock
          key={section.id}
          section={section}
          navBadges={navBadges}
          openGroupIds={openGroupIds}
          onToggleGroup={toggleGroup}
          isFirst={index === 0 && starredItems.length === 0}
        />
      ))}
      <div className="mt-auto space-y-0.5 border-t border-[var(--admin-border)] px-1 pt-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]"
        >
          <FolderOpen className="size-3.5" aria-hidden />
          {t("admin.viewSite")}
        </Link>
      </div>
    </aside>
  );
}
