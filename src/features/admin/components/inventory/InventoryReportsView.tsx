"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CollectionTable, type CollectionColumn } from "@/features/admin/components/CollectionTable";
import { Button } from "@/components/ui/button";
import { useLocale, useTranslations } from "@/lib/i18n";
import { approveWastage } from "@/services/inventory/actions";
import { localizedItemName } from "@/services/inventory/i18nMaps";
import type { InventoryTransaction } from "@/services/inventory/types";

export type VarianceRow = {
  item_id: string;
  item_name: string;
  item_name_ar: string | null;
  unit: string;
  expected_qty: number;
  actual_qty: number;
  unexplained_variance: number;
};

type PendingRow = InventoryTransaction & { item_name: string; item_name_ar: string | null };

type Props = {
  initialPending: PendingRow[];
  variance: VarianceRow[];
};

export function InventoryReportsView({ initialPending, variance }: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  const [pending, setPending] = useState(initialPending);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function decide(id: string, decision: "confirmed" | "rejected") {
    setBusyId(id);
    try {
      await approveWastage({ transaction_id: id, decision, note: "" });
      setPending((prev) => prev.filter((row) => row.id !== id));
      toast.success(
        decision === "confirmed"
          ? t("admin.pages.inventory.reports.confirmed")
          : t("admin.pages.inventory.reports.rejected"),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("admin.pages.inventory.reports.reviewFailed"));
    } finally {
      setBusyId(null);
    }
  }

  const pendingColumns: CollectionColumn<PendingRow>[] = [
    {
      key: "item_name",
      header: t("admin.pages.inventory.colItem"),
      cell: (r) => localizedItemName(locale, r.item_name, r.item_name_ar),
      searchValue: (r) => `${r.item_name} ${r.item_name_ar ?? ""}`,
    },
    { key: "type", header: t("admin.pages.inventory.reports.colType"), cell: (r) => <span className="capitalize">{r.type}</span> },
    { key: "qty", header: t("admin.pages.inventory.reports.colQty"), cell: (r) => r.qty },
    { key: "total_cost_egp", header: t("admin.pages.inventory.reports.colCost"), cell: (r) => r.total_cost_egp.toFixed(2) },
    { key: "reason_code", header: t("admin.pages.inventory.reports.colReason"), cell: (r) => (r.reason_code ?? "").replace(/_/g, " ") },
    { key: "created_at", header: t("admin.pages.inventory.reports.colLogged"), cell: (r) => new Date(r.created_at).toLocaleString() },
    {
      key: "review",
      header: t("admin.pages.inventory.reports.colReview"),
      sortable: false,
      cell: (r) => (
        <div className="flex gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busyId === r.id}
            onClick={() => decide(r.id, "confirmed")}
          >
            {t("admin.pages.inventory.reports.confirm")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={busyId === r.id}
            onClick={() => decide(r.id, "rejected")}
          >
            {t("admin.pages.inventory.reports.reject")}
          </Button>
        </div>
      ),
    },
  ];

  const varianceColumns: CollectionColumn<VarianceRow>[] = [
    {
      key: "item_name",
      header: t("admin.pages.inventory.colItem"),
      cell: (r) => localizedItemName(locale, r.item_name, r.item_name_ar),
      searchValue: (r) => `${r.item_name} ${r.item_name_ar ?? ""}`,
    },
    { key: "expected_qty", header: t("admin.pages.inventory.reports.colExpected"), cell: (r) => `${r.expected_qty} ${r.unit}` },
    { key: "actual_qty", header: t("admin.pages.inventory.reports.colActual"), cell: (r) => `${r.actual_qty} ${r.unit}` },
    {
      key: "unexplained_variance",
      header: t("admin.pages.inventory.reports.colVariance"),
      cell: (r) => (
        <span className={r.unexplained_variance > 0 ? "font-semibold text-red-600" : ""}>
          {r.unexplained_variance}
        </span>
      ),
      sortValue: (r) => Math.abs(r.unexplained_variance),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="mb-2 text-sm font-semibold">{t("admin.pages.inventory.reports.pendingHeading")}</h2>
        <p className="mb-3 text-xs text-[var(--admin-muted)]">{t("admin.pages.inventory.reports.pendingHint")}</p>
        <CollectionTable
          tableId="inventory-pending-approvals"
          rows={pending}
          columns={pendingColumns}
          emptyMessage={t("admin.pages.inventory.reports.emptyPending")}
          enableSelection={false}
        />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">{t("admin.pages.inventory.reports.varianceHeading")}</h2>
        <p className="mb-3 text-xs text-[var(--admin-muted)]">{t("admin.pages.inventory.reports.varianceHint")}</p>
        <CollectionTable
          tableId="inventory-variance"
          rows={variance}
          columns={varianceColumns}
          emptyMessage={t("admin.pages.inventory.reports.emptyVariance")}
          enableSelection={false}
        />
      </section>
    </div>
  );
}
