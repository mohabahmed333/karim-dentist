"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { FolderOpen } from "lucide-react";
import {
  adminNavSections,
  filterAdminNavSections,
  findActiveAdminNavGroupIds,
} from "@/features/admin/lib/adminNav";
import { useTranslations } from "@/lib/i18n";
import { AdminNavSectionBlock } from "./AdminNavSectionBlock";

type Props = {
  pendingCount?: number;
  mobile?: boolean;
  /** Omit to show every section unfiltered (e.g. showreel demos with no session). */
  permissions?: string[] | null;
};

export function AdminSidebar({
  pendingCount = 0,
  mobile = false,
  permissions,
}: Props) {
  const t = useTranslations();
  const pathname = usePathname();
  const permissionSet = permissions ? new Set(permissions) : null;
  const sections = filterAdminNavSections(adminNavSections, permissionSet);

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
  const [openGroupIds, setOpenGroupIds] = useState(activeGroupIds);
  const [renderedForPathname, setRenderedForPathname] = useState(pathname);
  if (pathname !== renderedForPathname) {
    setRenderedForPathname(pathname);
    setOpenGroupIds(activeGroupIds);
  }

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
      className={
        mobile
          ? "flex h-full w-[220px] shrink-0 flex-col overflow-y-auto bg-[var(--admin-canvas)] px-2.5 py-3"
          : "flex h-full w-[220px] shrink-0 flex-col overflow-y-auto bg-[var(--admin-canvas)] px-2.5 py-3"
      }
    >
      <div className="mb-4 px-2">
        <p className="text-[13px] font-semibold tracking-tight text-[var(--admin-text)]">
          {t("admin.brand")}
        </p>
        <p className="text-[11px] text-[var(--admin-muted)]">
          {t("admin.clinicWorkspace")}
        </p>
      </div>
      {sections.map((section, index) => (
        <AdminNavSectionBlock
          key={section.id}
          section={section}
          pendingCount={pendingCount}
          openGroupIds={openGroupIds}
          onToggleGroup={toggleGroup}
          isFirst={index === 0}
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
