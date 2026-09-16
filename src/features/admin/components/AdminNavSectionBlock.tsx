"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import {
  isAdminNavGroup,
  type AdminNavGroup,
  type AdminNavItem,
  type AdminNavSection,
  type AdminNavSectionEntry,
} from "@/features/admin/lib/adminNav";
import { useTranslations } from "@/lib/i18n";
import { AdminNavLink } from "./AdminNavLink";
import {
  AdminNavTreeList,
  AdminNavTreeRow,
  NAV_INDENT,
  NAV_ROW_MIDPOINT,
  NAV_TRUNK_BACK,
} from "./AdminNavTreeList";
import { cn } from "@/lib/utils";

type Props = {
  section: AdminNavSection;
  navBadges?: Record<string, number>;
  /** Every group/sub-group currently expanded, across every depth. */
  openGroupIds: Set<string>;
  onToggleGroup: (groupId: string) => void;
  /** The very first rendered section skips the top divider. */
  isFirst: boolean;
};

/**
 * Everything the rows inside this group are counting, added up.
 *
 * A badge on a child is invisible while the group is collapsed, which is the
 * normal state — the billing queue could fill up with nobody seeing a thing.
 * The group carries its children's total so the count survives collapsing.
 */
function groupBadgeTotal(
  entries: AdminNavSectionEntry[],
  navBadges: Record<string, number>,
): number {
  let total = 0;
  for (const entry of entries) {
    if ("items" in entry && Array.isArray(entry.items)) {
      total += groupBadgeTotal(entry.items, navBadges);
      continue;
    }
    const href = (entry as { href?: string }).href;
    if (href) total += navBadges[href] ?? 0;
  }
  return total;
}

/** The `mt-1.5` between a group row and the subtree it opens. */
const CHILD_GAP = 6;

function NavGroup({
  group,
  depth,
  isLast,
  isOpen,
  onToggle,
  onToggleGroup,
  openGroupIds,
  navBadges,
}: {
  group: AdminNavGroup;
  depth: number;
  isLast: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onToggleGroup: (groupId: string) => void;
  openGroupIds: Set<string>;
  navBadges?: Record<string, number>;
}) {
  const t = useTranslations();
  const label = t(group.labelKey);
  const Icon = depth === 0 ? group.icon : undefined;
  const collapsedBadge = groupBadgeTotal(group.items, navBadges ?? {});

  return (
    <>
      {/* Closing at its own turn even while open: the subtree that follows
          hangs off this row one level in, it does not continue this level. */}
      <AdminNavTreeRow isLast={isLast} depth={depth}>
        {/* While the group is open its subtree hangs off this row's node dot:
            the children's trunk starts at the dot and runs down out of the row
            into their list, so the tree never restarts below a parent. */}
        {isOpen ? (
          <span
            aria-hidden
            className="absolute border-s border-[var(--admin-border)]"
            style={{
              insetInlineStart: (depth + 1) * NAV_INDENT - NAV_TRUNK_BACK,
              top: NAV_ROW_MIDPOINT,
              bottom: -CHILD_GAP,
            }}
          />
        ) : null}
        <div className="flex w-full items-center gap-1">
          {group.href ? (
            <AdminNavLink
              href={group.href}
              label={label}
              icon={Icon}
              className="flex-1"
              activeStyle={depth > 0 ? "text" : "pill"}
            />
          ) : (
            <button
              type="button"
              className={cn(
                "flex flex-1 items-center gap-1.5 truncate px-2 py-1 text-start",
                depth === 0
                  ? "text-[13px] text-[var(--admin-text)]"
                  : "text-[12px] font-normal text-[var(--admin-muted)]",
              )}
              onClick={onToggle}
            >
              {Icon ? <Icon className="size-3.5 shrink-0" aria-hidden /> : null}
              <span className="truncate">{label}</span>
            </button>
          )}
          {!isOpen && collapsedBadge > 0 ? (
            <span
              className="shrink-0 rounded-full bg-[var(--admin-primary)] px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white"
              aria-label={`${collapsedBadge}`}
            >
              {collapsedBadge > 9 ? "9+" : collapsedBadge}
            </span>
          ) : null}
          <button
            type="button"
            aria-label={label}
            aria-expanded={isOpen}
            onClick={onToggle}
            className="flex size-6 shrink-0 items-center justify-center rounded text-[var(--admin-muted)] hover:bg-[var(--admin-hover)]"
          >
            <ChevronRight
              className={cn(
                "size-3.5 shrink-0 transition-transform",
                isOpen ? "rotate-90" : "",
              )}
              aria-hidden
            />
          </button>
        </div>
      </AdminNavTreeRow>
      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            key="children"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="relative mt-1.5">
              {/* This group's own level carried down the side of the subtree to
                  the sibling below it, so expanding a group never breaks the
                  line its level is drawn with. */}
              {depth > 0 && !isLast ? (
                <span
                  aria-hidden
                  className="absolute -top-1.5 bottom-0 border-s border-[var(--admin-border)]"
                  style={{
                    insetInlineStart: depth * NAV_INDENT - NAV_TRUNK_BACK,
                  }}
                />
              ) : null}
              <AdminNavEntryList
                entries={group.items}
                depth={depth + 1}
                openGroupIds={openGroupIds}
                onToggleGroup={onToggleGroup}
                navBadges={navBadges}
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function AdminNavEntryList({
  entries,
  depth,
  openGroupIds,
  onToggleGroup,
  navBadges,
}: {
  entries: AdminNavSectionEntry[];
  depth: number;
  openGroupIds: Set<string>;
  onToggleGroup: (groupId: string) => void;
  navBadges?: Record<string, number>;
}) {
  const blocks: ReactNode[] = [];
  let run: AdminNavItem[] = [];
  const flushRun = (key: string, closesLevel: boolean) => {
    if (run.length === 0) return;
    blocks.push(
      <AdminNavTreeList
        key={key}
        items={run}
        depth={depth}
        navBadges={navBadges}
        closesLevel={closesLevel}
      />,
    );
    run = [];
  };
  entries.forEach((entry, index) => {
    if (isAdminNavGroup(entry)) {
      flushRun(`run-${index}`, false);
      blocks.push(
        <NavGroup
          key={entry.id}
          group={entry}
          depth={depth}
          isLast={index === entries.length - 1}
          isOpen={openGroupIds.has(entry.id)}
          onToggle={() => onToggleGroup(entry.id)}
          onToggleGroup={onToggleGroup}
          openGroupIds={openGroupIds}
          navBadges={navBadges}
        />,
      );
    } else {
      run.push(entry);
    }
  });
  flushRun("run-end", true);
  return <>{blocks}</>;
}

export function AdminNavSectionBlock({
  section,
  navBadges = {},
  openGroupIds,
  onToggleGroup,
  isFirst,
}: Props) {
  const t = useTranslations();
  const title = t(section.titleKey);
  const entries: AdminNavSectionEntry[] =
    section.entries ?? [...(section.items ?? []), ...(section.groups ?? [])];

  return (
    <section
      className={cn(
        "mb-6",
        !isFirst && "border-t border-[var(--admin-border)] pt-4",
      )}
    >
      <div className="mb-1 px-2">
        <h2 className="text-[11px] font-medium tracking-wide text-[var(--admin-muted)]">
          {title}
        </h2>
      </div>
      <AdminNavEntryList
        entries={entries}
        depth={0}
        openGroupIds={openGroupIds}
        onToggleGroup={onToggleGroup}
        navBadges={navBadges}
      />
    </section>
  );
}
