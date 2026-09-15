"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CollectionTable, type CollectionColumn } from "@/features/admin/components/CollectionTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocale, useTranslations } from "@/lib/i18n";
import { ItemFormDialog } from "./ItemFormDialog";
import { SupplierFormDialog } from "./SupplierFormDialog";
import { RestockDialog } from "./RestockDialog";
import { AdjustmentDialog } from "./AdjustmentDialog";
import { WastageLogDialog } from "./WastageLogDialog";
import { archiveItem, archiveSupplier } from "@/services/inventory/actions";
import { CATEGORY_LABEL_KEYS, localizedItemName } from "@/services/inventory/i18nMaps";
import {
  getStockOnHand,
  listBatchesForItem,
  listTransactionsForItem,
} from "@/services/inventory/queries";
import type {
  InventoryBatch,
  InventoryItem,
  InventoryTransaction,
  Supplier,
} from "@/services/inventory/types";

type ItemWithStock = InventoryItem & { qty_on_hand: number };

type Props = {
  initialItems: ItemWithStock[];
  initialSuppliers: Supplier[];
};

export function InventoryManager({ initialItems, initialSuppliers }: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  const [view, setView] = useState<"items" | "suppliers">("items");
  const [items, setItems] = useState(initialItems);
  const [suppliers, setSuppliers] = useState(initialSuppliers);

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [batches, setBatches] = useState<InventoryBatch[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const [itemDialog, setItemDialog] = useState<{ open: boolean; item: InventoryItem | null }>({
    open: false,
    item: null,
  });
  const [supplierDialog, setSupplierDialog] = useState<{ open: boolean; supplier: Supplier | null }>({
    open: false,
    supplier: null,
  });
  const [restockOpen, setRestockOpen] = useState(false);
  const [wastageOpen, setWastageOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);

  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedItemId) ?? null,
    [items, selectedItemId],
  );

  async function refreshItemDetail(itemId: string) {
    setDetailLoading(true);
    try {
      const [b, tx, onHand] = await Promise.all([
        listBatchesForItem(itemId),
        listTransactionsForItem(itemId),
        getStockOnHand(itemId),
      ]);
      setBatches(b);
      setTransactions(tx);
      setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, qty_on_hand: onHand } : i)));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load item detail");
    } finally {
      setDetailLoading(false);
    }
  }

  function selectItem(id: string) {
    setSelectedItemId(id);
    void refreshItemDetail(id);
  }

  async function onArchiveItem(item: InventoryItem) {
    const name = localizedItemName(locale, item.name, item.name_ar);
    if (!confirm(t("admin.pages.inventory.archiveItemConfirm").replace("{name}", name))) return;
    try {
      await archiveItem(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      if (selectedItemId === item.id) setSelectedItemId(null);
      toast.success(t("admin.pages.inventory.itemArchived"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("admin.pages.inventory.archiveFailed"));
    }
  }

  async function onArchiveSupplier(supplier: Supplier) {
    if (!confirm(t("admin.pages.inventory.archiveSupplierConfirm").replace("{name}", supplier.name))) return;
    try {
      await archiveSupplier(supplier.id);
      setSuppliers((prev) => prev.filter((s) => s.id !== supplier.id));
      toast.success(t("admin.pages.inventory.supplierArchived"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("admin.pages.inventory.archiveFailed"));
    }
  }

  const itemColumns: CollectionColumn<ItemWithStock>[] = [
    {
      key: "name",
      header: t("admin.pages.inventory.colItem"),
      cell: (r) => <span className="font-medium">{localizedItemName(locale, r.name, r.name_ar)}</span>,
      searchValue: (r) => `${r.name} ${r.name_ar ?? ""}`,
    },
    {
      key: "category",
      header: t("admin.pages.inventory.colCategory"),
      cell: (r) => t(CATEGORY_LABEL_KEYS[r.category]),
    },
    {
      key: "qty_on_hand",
      header: t("admin.pages.inventory.colOnHand"),
      cell: (r) => (
        <span>
          {r.qty_on_hand} {r.unit}
        </span>
      ),
      sortValue: (r) => r.qty_on_hand,
    },
    {
      key: "min_stock_level",
      header: t("admin.pages.inventory.colMinLevel"),
      cell: (r) => r.min_stock_level,
      sortValue: (r) => r.min_stock_level,
    },
    {
      key: "status",
      header: t("admin.pages.inventory.colStatus"),
      cell: (r) =>
        r.min_stock_level > 0 && r.qty_on_hand <= r.min_stock_level ? (
          <Badge variant="destructive">{t("admin.pages.inventory.statusLow")}</Badge>
        ) : (
          <Badge variant="secondary">{t("admin.pages.inventory.statusOk")}</Badge>
        ),
      sortable: false,
    },
  ];

  const supplierColumns: CollectionColumn<Supplier>[] = [
    { key: "name", header: t("admin.pages.inventory.colSupplier"), cell: (r) => <span className="font-medium">{r.name}</span>, searchValue: (r) => r.name },
    { key: "contact_name", header: t("admin.pages.inventory.colContact"), cell: (r) => r.contact_name },
    { key: "phone", header: t("admin.pages.inventory.colPhone"), cell: (r) => r.phone },
    { key: "email", header: t("admin.pages.inventory.colEmail"), cell: (r) => r.email ?? "" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex rounded-lg border border-[var(--admin-border)] p-0.5">
          <button
            type="button"
            onClick={() => setView("items")}
            className={`rounded-md px-3 py-1.5 text-[12px] font-medium ${view === "items" ? "bg-[var(--admin-hover)]" : ""}`}
          >
            {t("admin.pages.inventory.tabItems")}
          </button>
          <button
            type="button"
            onClick={() => setView("suppliers")}
            className={`rounded-md px-3 py-1.5 text-[12px] font-medium ${view === "suppliers" ? "bg-[var(--admin-hover)]" : ""}`}
          >
            {t("admin.pages.inventory.tabSuppliers")}
          </button>
        </div>
        {view === "items" ? (
          <Button type="button" size="sm" onClick={() => setItemDialog({ open: true, item: null })}>
            {t("admin.pages.inventory.addItem")}
          </Button>
        ) : (
          <Button type="button" size="sm" onClick={() => setSupplierDialog({ open: true, supplier: null })}>
            {t("admin.pages.inventory.addSupplier")}
          </Button>
        )}
      </div>

      {view === "items" ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
          <CollectionTable
            tableId="inventory-items"
            rows={items}
            columns={itemColumns}
            onRowClick={selectItem}
            selectedId={selectedItemId}
            emptyMessage={t("admin.pages.inventory.emptyItems")}
            rowActions={[
              { id: "edit", label: t("admin.edit"), icon: "edit", onClick: (r) => setItemDialog({ open: true, item: r }) },
              { id: "archive", label: t("admin.pages.inventory.archive"), icon: "delete", tone: "danger", onClick: onArchiveItem },
            ]}
          />

          <div className="rounded-xl border border-[var(--admin-border)] p-4">
            {!selectedItem ? (
              <p className="text-sm text-[var(--admin-muted)]">{t("admin.pages.inventory.selectItemHint")}</p>
            ) : (
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-sm font-semibold">
                    {localizedItemName(locale, selectedItem.name, selectedItem.name_ar)}
                  </h3>
                  <p className="text-xs text-[var(--admin-muted)]">
                    {t("admin.pages.inventory.stockSummary")
                      .replace("{qty}", String(selectedItem.qty_on_hand))
                      .replace("{unit}", selectedItem.unit)
                      .replace("{min}", String(selectedItem.min_stock_level))}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setRestockOpen(true)}>
                    {t("admin.pages.inventory.receiveStock")}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setAdjustOpen(true)}>
                    {t("admin.pages.inventory.recount")}
                  </Button>
                  <Button type="button" size="sm" variant="destructive" onClick={() => setWastageOpen(true)}>
                    {t("admin.pages.inventory.logWastage")}
                  </Button>
                </div>

                <div>
                  <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
                    {t("admin.pages.inventory.batchesHeading")}
                    {detailLoading ? ` ${t("admin.pages.inventory.loadingSuffix")}` : ""}
                  </h4>
                  <div className="flex flex-col gap-1 text-xs">
                    {batches.length === 0 ? (
                      <p className="text-[var(--admin-muted)]">{t("admin.pages.inventory.noBatches")}</p>
                    ) : (
                      batches.map((b) => (
                        <div key={b.id} className="flex items-center justify-between rounded-md border border-[var(--admin-border)] px-2 py-1.5">
                          <span>
                            {b.lot_number
                              ? t("admin.pages.inventory.lotLabel").replace("{lot}", b.lot_number)
                              : t("admin.pages.inventory.noLot")}
                            {b.expires_on ? ` · ${t("admin.pages.inventory.expLabel").replace("{date}", b.expires_on)}` : ""}
                          </span>
                          <span className="font-medium">{b.qty_remaining}/{b.qty_received}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
                    {t("admin.pages.inventory.activityHeading")}
                  </h4>
                  <div className="flex flex-col gap-1 text-xs">
                    {transactions.length === 0 ? (
                      <p className="text-[var(--admin-muted)]">{t("admin.pages.inventory.noTransactions")}</p>
                    ) : (
                      transactions.slice(0, 10).map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between rounded-md border border-[var(--admin-border)] px-2 py-1.5">
                          <span className="capitalize">{tx.type}{tx.reason_code ? ` · ${tx.reason_code.replace(/_/g, " ")}` : ""}</span>
                          <span className="font-medium">{tx.qty}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <CollectionTable
          tableId="inventory-suppliers"
          rows={suppliers}
          columns={supplierColumns}
          emptyMessage={t("admin.pages.inventory.emptySuppliers")}
          rowActions={[
            { id: "edit", label: t("admin.edit"), icon: "edit", onClick: (r) => setSupplierDialog({ open: true, supplier: r }) },
            { id: "archive", label: t("admin.pages.inventory.archive"), icon: "delete", tone: "danger", onClick: onArchiveSupplier },
          ]}
        />
      )}

      <ItemFormDialog
        open={itemDialog.open}
        onOpenChange={(open) => setItemDialog((d) => ({ ...d, open }))}
        item={itemDialog.item}
        suppliers={suppliers}
        onSaved={(saved) =>
          setItems((prev) => {
            const withStock = { ...saved, qty_on_hand: prev.find((i) => i.id === saved.id)?.qty_on_hand ?? 0 };
            const exists = prev.some((i) => i.id === saved.id);
            return exists ? prev.map((i) => (i.id === saved.id ? withStock : i)) : [withStock, ...prev];
          })
        }
      />
      <SupplierFormDialog
        open={supplierDialog.open}
        onOpenChange={(open) => setSupplierDialog((d) => ({ ...d, open }))}
        supplier={supplierDialog.supplier}
        onSaved={(saved) =>
          setSuppliers((prev) => {
            const exists = prev.some((s) => s.id === saved.id);
            return exists ? prev.map((s) => (s.id === saved.id ? saved : s)) : [saved, ...prev];
          })
        }
      />
      <RestockDialog
        open={restockOpen}
        onOpenChange={setRestockOpen}
        item={selectedItem}
        suppliers={suppliers}
        onSaved={() => selectedItemId && refreshItemDetail(selectedItemId)}
      />
      <WastageLogDialog
        open={wastageOpen}
        onOpenChange={setWastageOpen}
        item={selectedItem}
        onSaved={() => selectedItemId && refreshItemDetail(selectedItemId)}
      />
      <AdjustmentDialog
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
        item={selectedItem}
        onSaved={() => selectedItemId && refreshItemDetail(selectedItemId)}
      />
    </div>
  );
}
