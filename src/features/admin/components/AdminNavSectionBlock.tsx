"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import {
  isAdminNavGroup,
  type AdminNavGroup,
  type AdminNavItem,
  type AdminNavSection,
} from "@/features/admin/lib/adminNav";
import { useTranslations } from "@/lib/i18n";
import { AdminNavLink } from "./AdminNavLink";
import { AdminNavTreeList, AdminNavTreeRow } from "./AdminNavTreeList";
import { cn } from "@/lib/utils";

type Props = {
  section: AdminNavSection;
  pendingCount?: number;
};

function NavGroup({
  group,
  isLast,
  pendingCount,
}: {
  group: AdminNavGroup;
  isLast: boolean;
  pendingCount?: number;
}) {
  const t = useTranslations();
  const [open, setOpen] = useState(group.defaultOpen ?? true);
  const label = t(group.labelKey);

  return (
    <>
      <AdminNavTreeRow isLast={isLast && !open} depth={0}>
        <div className="flex w-full items-center gap-1">
          {group.href ? (
            <AdminNavLink href={group.href} label={label} className="flex-1" />
          ) : (
            <button
              type="button"
              className="flex-1 truncate px-2 py-1 text-start text-[13px] text-[var(--admin-text)]"
              onClick={() => setOpen((value) => !value)}
            >
              {label}
            </button>
          )}
          <button
            type="button"
            aria-label={label}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="flex size-6 shrink-0 items-center justify-center rounded text-[var(--admin-muted)] hover:bg-[var(--admin-hover)]"
          >
            <ChevronDown
              className={cn(
                "size-3.5 shrink-0 transition-transform",
                open ? "rotate-180" : "",
              )}
              aria-hidden
            />
          </button>
        </div>
      </AdminNavTreeRow>
      {open ? (
        <AdminNavTreeList
          items={group.items}
          depth={1}
          pendingCount={pendingCount}
        />
      ) : null}
    </>
  );
}

export function AdminNavSectionBlock({ section, pendingCount = 0 }: Props) {
  const t = useTranslations();
  const title = t(section.titleKey);

  const blocks: ReactNode[] = [];
  if (section.entries) {
    let run: AdminNavItem[] = [];
    const flushRun = (key: string) => {
      if (run.length === 0) return;
      blocks.push(
        <AdminNavTreeList key={key} items={run} pendingCount={pendingCount} />,
      );
      run = [];
    };
    section.entries.forEach((entry, index) => {
      if (isAdminNavGroup(entry)) {
        flushRun(`run-${index}`);
        blocks.push(
          <NavGroup
            key={entry.id}
            group={entry}
            isLast={index === section.entries!.length - 1}
            pendingCount={pendingCount}
          />,
        );
      } else {
        run.push(entry);
      }
    });
    flushRun("run-end");
  } else {
    if (section.items) {
      blocks.push(
        <AdminNavTreeList
          key="items"
          items={section.items}
          pendingCount={pendingCount}
        />,
      );
    }
    const groups = section.groups ?? [];
    groups.forEach((group, index) => {
      blocks.push(
        <NavGroup
          key={group.id}
          group={group}
          isLast={index === groups.length - 1}
          pendingCount={pendingCount}
        />,
      );
    });
  }

  return (
    <section className="mb-4">
      <div className="mb-1 px-2">
        <h2 className="text-[11px] font-medium tracking-wide text-[var(--admin-muted)]">
          {title}
        </h2>
      </div>
      {blocks}
    </section>
  );
}
