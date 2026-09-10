"use client";

import { Plus, X } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import {
  DASHBOARD_WIDGET_CATALOG,
  type DashboardWidgetId,
} from "@/features/admin/lib/dashboardLayout";

type CatalogProps = {
  missing: DashboardWidgetId[];
  onAdd: (id: DashboardWidgetId) => void;
  onClose: () => void;
};

export function DashboardWidgetCatalog({
  missing,
  onAdd,
  onClose,
}: CatalogProps) {
  const t = useTranslations();
  return (
    <div className="absolute end-0 top-full z-20 mt-1 w-64 overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] shadow-lg">
      <div className="flex items-center justify-between border-b border-[var(--admin-border)] px-3 py-2">
        <p className="text-[12px] font-semibold text-[var(--admin-text)]">
          {t("admin.overview.customize.catalog")}
        </p>
        <button
          type="button"
          aria-label={t("admin.close")}
          className="rounded p-1 text-[var(--admin-muted)] hover:bg-[var(--admin-hover)]"
          onClick={onClose}
        >
          <X className="size-3.5" />
        </button>
      </div>
      {missing.length === 0 ? (
        <p className="px-3 py-4 text-[12px] text-[var(--admin-muted)]">
          {t("admin.overview.customize.catalogEmpty")}
        </p>
      ) : (
        <ul className="max-h-64 overflow-y-auto p-1">
          {missing.map((id) => {
            const meta = DASHBOARD_WIDGET_CATALOG.find((w) => w.id === id)!;
            return (
              <li key={id}>
                <button
                  type="button"
                  data-dash-widget-catalog-item={id}
                  className="flex w-full items-center gap-2 rounded px-2 py-2 text-start text-[12px] text-[var(--admin-text)] hover:bg-[var(--admin-hover)]"
                  onClick={() => onAdd(id)}
                >
                  <Plus className="size-3.5 shrink-0 text-[var(--admin-muted)]" />
                  {t(meta.labelKey)}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
