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
import { restock } from "@/services/inventory/actions";
import type { InventoryItem, Supplier } from "@/services/inventory/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  suppliers: Supplier[];
  onSaved: () => void;
};

export function RestockDialog({ open, onOpenChange, item, suppliers, onSaved }: Props) {
  const [pending, setPending] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [expiresOn, setExpiresOn] = useState("");
  const [qty, setQty] = useState("");
  const [unitCost, setUnitCost] = useState("");

  const [seededFor, setSeededFor] = useState<string | null>(null);
  const key = open ? (item?.id ?? null) : null;
  if (open && key !== seededFor) {
    setSeededFor(key);
    setSupplierId(item?.default_supplier_id ?? "");
    setLotNumber("");
    setExpiresOn("");
    setQty("");
    setUnitCost(item?.last_unit_cost_egp != null ? String(item.last_unit_cost_egp) : "");
  }

  async function onSave() {
    if (!item) return;
    setPending(true);
    try {
      await restock({
        item_id: item.id,
        supplier_id: supplierId || null,
        lot_number: lotNumber || null,
        expires_on: expiresOn || null,
        qty_received: Number(qty),
        unit_cost_egp: Number(unitCost) || 0,
      });
      toast.success("Stock received");
      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Restock failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Receive stock — {item?.name}</DialogTitle>
          <DialogDescription>
            Records a new batch. Lot/expiry matter for anesthesia, Botox, bone graft, and sutures.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="col-span-2 flex flex-col gap-1">
            <Label>Supplier</Label>
            <Select value={supplierId || "none"} onValueChange={(v) => setSupplierId(v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No supplier</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="restock-qty">Quantity received</Label>
            <Input id="restock-qty" type="number" min="0" step="0.01" value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="restock-cost">Unit cost (EGP)</Label>
            <Input id="restock-cost" type="number" min="0" step="0.01" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} />
          </div>
          {item?.tracks_batches ? (
            <>
              <div className="flex flex-col gap-1">
                <Label htmlFor="restock-lot">Lot / batch number</Label>
                <Input id="restock-lot" value={lotNumber} onChange={(e) => setLotNumber(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="restock-expiry">Expiry date</Label>
                <Input id="restock-expiry" type="date" value={expiresOn} onChange={(e) => setExpiresOn(e.target.value)} />
              </div>
            </>
          ) : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={pending || !qty || Number(qty) <= 0}
            onClick={onSave}
          >
            {pending ? "Saving…" : "Receive stock"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
