"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Plus, PanelLeft, Search } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { AdminMobileNav } from "./AdminMobileNav";
import {
  adminPageLabelKeys,
  flattenAdminNavItems,
} from "@/features/admin/lib/adminNav";
import { useQuickBook } from "./quick-book/QuickBookContext";

type Props = {
  pendingCount?: number;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
};

export function AdminTopbar({
  pendingCount = 0,
  sidebarCollapsed = false,
  onToggleSidebar,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();
  const { openQuickBook } = useQuickBook();
  const [query, setQuery] = useState("");
  const sectionKey =
    adminPageLabelKeys[pathname] ??
    (pathname.startsWith("/admin/customize")
      ? adminPageLabelKeys["/admin/customize"]
      : undefined);
  const section = sectionKey ? t(sectionKey) : t("admin.nav.admin");
  const toggleLabel = sidebarCollapsed
    ? t("admin.expandMenu")
    : t("admin.collapseMenu");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return flattenAdminNavItems().filter((item) =>
      t(item.labelKey).toLowerCase().includes(q),
    );
  }, [query, t]);

  return (
    <header className="sticky top-0 z-40 shrink-0 border-b border-[var(--admin-border)] bg-[var(--admin-panel)]/90 px-4 py-2 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-3">
        <AdminMobileNav pendingCount={pendingCount} />
        {onToggleSidebar ? (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={toggleLabel}
            title={toggleLabel}
            aria-expanded={!sidebarCollapsed}
            className="hidden shrink-0 rounded-md p-1.5 text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)] lg:inline-flex"
          >
            <PanelLeft className="size-4" aria-hidden />
          </button>
        ) : null}
        <div className="min-w-0 text-[13px]">
          <p className="truncate text-[var(--admin-muted)]">
            {t("admin.brand")}{" "}
            <span className="text-[var(--admin-border)]">/</span>{" "}
            <span className="font-medium text-[var(--admin-text)]">{section}</span>
          </p>
        </div>
        <div className="relative mx-auto hidden w-full max-w-xs md:block">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--admin-muted)]" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("admin.search")}
            className="h-7 w-full rounded-md border border-[var(--admin-border)] bg-[var(--admin-canvas)] pe-3 ps-8 text-[13px] text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-muted)]"
          />
          {results.length > 0 ? (
            <div className="admin-card absolute inset-x-0 top-full mt-1.5 overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)]">
              {results.map((item) => (
                <button
                  key={item.href}
                  type="button"
                  className="block w-full px-3 py-1.5 text-start text-[13px] text-[var(--admin-text)] hover:bg-[var(--admin-hover)]"
                  onClick={() => {
                    router.push(item.href);
                    setQuery("");
                  }}
                >
                  {t(item.labelKey)}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="ms-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => openQuickBook()}
            className="inline-flex h-7 items-center gap-1 rounded-md px-2.5 text-[12px] font-medium text-white hover:opacity-90"
            style={{ background: "var(--admin-primary)" }}
          >
            <Plus className="size-3.5" />
            {t("admin.new")}
          </button>
        </div>
      </div>
    </header>
  );
}
