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
import { AdminNavTreeList, AdminNavTreeRow } from "./AdminNavTreeList";
import { cn } from "@/lib/utils";

type Props = {
  section: AdminNavSection;
  pendingCount?: number;
  /** Every group/sub-group currently expanded, across every depth. */
  openGroupIds: Set<string>;
  onToggleGroup: (groupId: string) => void;
  /** The very first rendered section skips the top divider. */
  isFirst: boolean;
};

function NavGroup({
  group,
  depth,
  isLast,
  isOpen,
  onToggle,
  onToggleGroup,
  openGroupIds,
  pendingCount,
}: {
  group: AdminNavGroup;
  depth: number;
  isLast: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onToggleGroup: (groupId: string) => void;
  openGroupIds: Set<string>;
  pendingCount?: number;
}) {
  const t = useTranslations();
  const label = t(group.labelKey);
  const Icon = depth === 0 ? group.icon : undefined;

  return (
    <>
      <AdminNavTreeRow isLast={isLast && !isOpen} depth={depth}>
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
            <div className="mt-1.5">
              <AdminNavEntryList
                entries={group.items}
                depth={depth + 1}
                openGroupIds={openGroupIds}
                onToggleGroup={onToggleGroup}
                pendingCount={pendingCount}
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
  pendingCount,
}: {
  entries: AdminNavSectionEntry[];
  depth: number;
  openGroupIds: Set<string>;
  onToggleGroup: (groupId: string) => void;
  pendingCount?: number;
}) {
  const blocks: ReactNode[] = [];
  let run: AdminNavItem[] = [];
  const flushRun = (key: string) => {
    if (run.length === 0) return;
    blocks.push(
      <AdminNavTreeList
        key={key}
        items={run}
        depth={depth}
        pendingCount={pendingCount}
      />,
    );
    run = [];
  };
  entries.forEach((entry, index) => {
    if (isAdminNavGroup(entry)) {
      flushRun(`run-${index}`);
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
          pendingCount={pendingCount}
        />,
      );
    } else {
      run.push(entry);
    }
  });
  flushRun("run-end");
  return <>{blocks}</>;
}

export function AdminNavSectionBlock({
  section,
  pendingCount = 0,
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
        pendingCount={pendingCount}
      />
    </section>
  );
}
