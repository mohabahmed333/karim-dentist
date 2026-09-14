"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CollectionTable, type CollectionColumn } from "@/features/admin/components/CollectionTable";
import { Button } from "@/components/ui/button";
import { approveWastage } from "@/services/inventory/actions";
import type { InventoryTransaction } from "@/services/inventory/types";

export type VarianceRow = {
  item_id: string;
  item_name: string;
  unit: string;
  expected_qty: number;
  actual_qty: number;
  unexplained_variance: number;
};

type PendingRow = InventoryTransaction & { item_name: string };

type Props = {
  initialPending: PendingRow[];
  variance: VarianceRow[];
};

export function InventoryReportsView({ initialPending, variance }: Props) {
  const [pending, setPending] = useState(initialPending);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function decide(id: string, decision: "confirmed" | "rejected") {
    setBusyId(id);
    try {
      await approveWastage({ transaction_id: id, decision, note: "" });
      setPending((prev) => prev.filter((row) => row.id !== id));
      toast.success(decision === "confirmed" ? "Wastage confirmed" : "Wastage rejected");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Review failed");
    } finally {
      setBusyId(null);
    }
  }

  const pendingColumns: CollectionColumn<PendingRow>[] = [
    { key: "item_name", header: "Item", cell: (r) => r.item_name, searchValue: (r) => r.item_name },
    { key: "type", header: "Type", cell: (r) => <span className="capitalize">{r.type}</span> },
    { key: "qty", header: "Qty", cell: (r) => r.qty },
    { key: "total_cost_egp", header: "Cost (EGP)", cell: (r) => r.total_cost_egp.toFixed(2) },
    { key: "reason_code", header: "Reason", cell: (r) => (r.reason_code ?? "").replace(/_/g, " ") },
    { key: "created_at", header: "Logged", cell: (r) => new Date(r.created_at).toLocaleString() },
    {
      key: "review",
      header: "Review",
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
            Confirm
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={busyId === r.id}
            onClick={() => decide(r.id, "rejected")}
          >
            Reject
          </Button>
        </div>
      ),
    },
  ];

  const varianceColumns: CollectionColumn<VarianceRow>[] = [
    { key: "item_name", header: "Item", cell: (r) => r.item_name, searchValue: (r) => r.item_name },
    { key: "expected_qty", header: "Expected from completed visits", cell: (r) => `${r.expected_qty} ${r.unit}` },
    { key: "actual_qty", header: "Actually consumed/wasted", cell: (r) => `${r.actual_qty} ${r.unit}` },
    {
      key: "unexplained_variance",
      header: "Unexplained variance",
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
        <h2 className="mb-2 text-sm font-semibold">Pending wastage approval</h2>
        <p className="mb-3 text-xs text-[var(--admin-muted)]">
          High-value wastage needs a second admin&apos;s confirmation before it&apos;s final. You
          cannot approve your own entries.
        </p>
        <CollectionTable
          tableId="inventory-pending-approvals"
          rows={pending}
          columns={pendingColumns}
          emptyMessage="Nothing pending review."
          enableSelection={false}
        />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Variance — fixed-kit recipes vs. actual usage</h2>
        <p className="mb-3 text-xs text-[var(--admin-muted)]">
          Compares what completed visits should have used (from each service&apos;s fixed-kit
          recipe) against what was actually logged as consumed or wasted. A consistent gap can mean
          unlogged use — or shrinkage.
        </p>
        <CollectionTable
          tableId="inventory-variance"
          rows={variance}
          columns={varianceColumns}
          emptyMessage="Not enough data yet."
          enableSelection={false}
        />
      </section>
    </div>
  );
}
