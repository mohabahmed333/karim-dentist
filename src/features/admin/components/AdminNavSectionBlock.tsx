"use client";

import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import type { AdminNavGroup, AdminNavSection } from "@/features/admin/lib/adminNav";
import { useTranslations } from "@/lib/i18n";
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
        <button
          type="button"
          className="flex w-full items-center justify-between py-1.5 text-[13px] text-[var(--admin-text)]"
          onClick={() => setOpen((value) => !value)}
        >
          <span>{label}</span>
          <ChevronDown
            className={cn(
              "size-3.5 shrink-0 text-[var(--admin-muted)] transition-transform",
              open ? "rotate-180" : "",
            )}
            aria-hidden
          />
        </button>
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
  const groups = section.groups ?? [];
  const title = t(section.titleKey);

  return (
    <section className="mb-4">
      <div className="mb-1 flex items-center justify-between px-2">
        <h2 className="text-[11px] font-medium tracking-wide text-[var(--admin-muted)]">
          {title}
        </h2>
        <button
          type="button"
          className="flex size-5 items-center justify-center rounded text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]"
          aria-label={`${t("admin.add")} ${title}`}
        >
          <Plus className="size-3" aria-hidden />
        </button>
      </div>
      {section.items ? (
        <AdminNavTreeList items={section.items} pendingCount={pendingCount} />
      ) : null}
      {groups.map((group, index) => (
        <NavGroup
          key={group.id}
          group={group}
          isLast={index === groups.length - 1}
          pendingCount={pendingCount}
        />
      ))}
    </section>
  );
}
