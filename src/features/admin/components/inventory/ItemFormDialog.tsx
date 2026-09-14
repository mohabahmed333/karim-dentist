"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createItem, updateItem } from "@/services/inventory/actions";
import type {
  InventoryItem,
  InventoryItemCategory,
  InventoryItemUnit,
  Supplier,
} from "@/services/inventory/types";

const CATEGORIES: InventoryItemCategory[] = [
  "implant",
  "anesthesia",
  "injectable",
  "suture",
  "bone_graft",
  "disposable",
  "ppe",
  "instrument",
  "general",
];
const UNITS: InventoryItemUnit[] = ["unit", "vial", "ampoule", "box", "ml", "mg", "syringe"];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  suppliers: Supplier[];
  onSaved: (item: InventoryItem) => void;
};

export function ItemFormDialog({ open, onOpenChange, item, suppliers, onSaved }: Props) {
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState(() => seed(item));

  const [seededFor, setSeededFor] = useState<string | null>(null);
  const key = open ? (item?.id ?? "new") : null;
  if (open && key !== seededFor) {
    setSeededFor(key);
    setForm(seed(item));
  }

  async function onSave() {
    setPending(true);
    try {
      const payload = {
        ...form,
        min_stock_level: Number(form.min_stock_level) || 0,
        reorder_qty: Number(form.reorder_qty) || 0,
        last_unit_cost_egp: form.last_unit_cost_egp === "" ? null : Number(form.last_unit_cost_egp),
        wastage_approval_threshold_egp:
          form.wastage_approval_threshold_egp === ""
            ? null
            : Number(form.wastage_approval_threshold_egp),
        default_supplier_id: form.default_supplier_id || null,
      };
      const saved = item
        ? await updateItem(item.id, payload)
        : await createItem(payload);
      onSaved(saved);
      toast.success(item ? "Item updated" : "Item created");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? "Edit item" : "New inventory item"}</DialogTitle>
          <DialogDescription>
            Consumables and stock this clinic tracks for loss prevention.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="col-span-2 flex flex-col gap-1">
            <Label htmlFor="item-name">Name</Label>
            <Input
              id="item-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="item-name-ar">Name (Arabic)</Label>
            <Input
              id="item-name-ar"
              value={form.name_ar}
              onChange={(e) => setForm((f) => ({ ...f, name_ar: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="item-sku">SKU</Label>
            <Input
              id="item-sku"
              value={form.sku}
              onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Category</Label>
            <Select
              value={form.category}
              onValueChange={(v) => setForm((f) => ({ ...f, category: v as InventoryItemCategory }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c.replace("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label>Unit</Label>
            <Select
              value={form.unit}
              onValueChange={(v) => setForm((f) => ({ ...f, unit: v as InventoryItemUnit }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {UNITS.map((u) => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="item-min">Minimum stock level</Label>
            <Input
              id="item-min"
              type="number"
              min="0"
              value={form.min_stock_level}
              onChange={(e) => setForm((f) => ({ ...f, min_stock_level: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="item-reorder">Suggested reorder qty</Label>
            <Input
              id="item-reorder"
              type="number"
              min="0"
              value={form.reorder_qty}
              onChange={(e) => setForm((f) => ({ ...f, reorder_qty: e.target.value }))}
            />
          </div>
          <div className="col-span-2 flex flex-col gap-1">
            <Label>Default supplier</Label>
            <Select
              value={form.default_supplier_id || "none"}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, default_supplier_id: v === "none" ? "" : v }))
              }
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No default supplier</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="item-cost">Last unit cost (EGP)</Label>
            <Input
              id="item-cost"
              type="number"
              min="0"
              value={form.last_unit_cost_egp}
              onChange={(e) => setForm((f) => ({ ...f, last_unit_cost_egp: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="item-threshold">Wastage approval threshold (EGP)</Label>
            <Input
              id="item-threshold"
              type="number"
              min="0"
              placeholder="Clinic default"
              value={form.wastage_approval_threshold_egp}
              onChange={(e) =>
                setForm((f) => ({ ...f, wastage_approval_threshold_egp: e.target.value }))
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={pending || !form.name.trim()} onClick={onSave}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function seed(item: InventoryItem | null) {
  return {
    name: item?.name ?? "",
    name_ar: item?.name_ar ?? "",
    sku: item?.sku ?? "",
    category: (item?.category ?? "general") as InventoryItemCategory,
    unit: (item?.unit ?? "unit") as InventoryItemUnit,
    tracks_batches: item?.tracks_batches ?? true,
    min_stock_level: String(item?.min_stock_level ?? 0),
    reorder_qty: String(item?.reorder_qty ?? 0),
    default_supplier_id: item?.default_supplier_id ?? "",
    last_unit_cost_egp: item?.last_unit_cost_egp != null ? String(item.last_unit_cost_egp) : "",
    wastage_approval_threshold_egp:
      item?.wastage_approval_threshold_egp != null
        ? String(item.wastage_approval_threshold_egp)
        : "",
  };
}
