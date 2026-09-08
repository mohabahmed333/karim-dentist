"use client";

import { usePathname } from "next/navigation";
import { PanelLeft } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { AdminMobileNav } from "./AdminMobileNav";
import { adminPageLabelKeys } from "@/features/admin/lib/adminNav";
import { AdminNewMenu } from "./AdminNewMenu";
import { CommandPalette } from "./CommandPalette";
import { DashboardLayoutTopbarControls } from "./overview/DashboardLayoutTopbarControls";

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
  const t = useTranslations();
  const sectionKey =
    adminPageLabelKeys[pathname] ??
    (pathname.startsWith("/admin/customize")
      ? adminPageLabelKeys["/admin/customize"]
      : undefined);
  const section = sectionKey ? t(sectionKey) : t("admin.nav.admin");
  const toggleLabel = sidebarCollapsed
    ? t("admin.expandMenu")
    : t("admin.collapseMenu");

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
        <div className="relative mx-auto min-w-0 w-full max-w-sm">
          <CommandPalette />
        </div>
        <div className="ms-auto flex items-center gap-2">
          <DashboardLayoutTopbarControls />
          <AdminNewMenu />
        </div>
      </div>
    </header>
  );
}
