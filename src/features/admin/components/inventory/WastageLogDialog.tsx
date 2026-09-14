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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { logWastage } from "@/services/inventory/actions";
import { WASTAGE_REASON_CODES, type InventoryItem } from "@/services/inventory/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  onSaved: () => void;
};

const REASON_LABELS: Record<string, string> = {
  dropped_contaminated: "Dropped / contaminated",
  expired: "Expired",
  damaged_packaging: "Damaged packaging",
  patient_no_show_opened: "Opened for a no-show",
  equipment_failure: "Equipment failure",
  recount_correction: "Recount correction",
  received_shipment: "Received shipment",
  returned_to_supplier: "Returned to supplier",
  other: "Other",
};

export function WastageLogDialog({ open, onOpenChange, item, onSaved }: Props) {
  const [pending, setPending] = useState(false);
  const [qty, setQty] = useState("");
  const [reasonCode, setReasonCode] = useState<string>("dropped_contaminated");
  const [reasonNote, setReasonNote] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  const [seededFor, setSeededFor] = useState<string | null>(null);
  const key = open ? (item?.id ?? null) : null;
  if (open && key !== seededFor) {
    setSeededFor(key);
    setQty("");
    setReasonCode("dropped_contaminated");
    setReasonNote("");
    setPhotoUrl("");
  }

  const estimatedCost =
    item?.last_unit_cost_egp && qty ? item.last_unit_cost_egp * Number(qty) : null;
  const needsNote = reasonCode === "other";

  async function onSave() {
    if (!item) return;
    setPending(true);
    try {
      await logWastage({
        item_id: item.id,
        qty: Number(qty),
        reason_code: reasonCode,
        reason_note: reasonNote,
        photo_url: photoUrl || null,
      });
      toast.success("Wastage logged");
      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Log failed");
    } finally {
      setPending(false);
    }
  }

  const canSave = Boolean(qty) && Number(qty) > 0 && (!needsNote || reasonNote.trim().length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log wastage — {item?.name}</DialogTitle>
          <DialogDescription>
            Dropped, contaminated, or expired stock. This never touches patient billing, and a
            reason code is always required.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="wastage-qty">Quantity ({item?.unit})</Label>
            <Input
              id="wastage-qty"
              type="number"
              min="0"
              step="0.01"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Reason</Label>
            <Select value={reasonCode} onValueChange={setReasonCode}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {WASTAGE_REASON_CODES.map((code) => (
                  <SelectItem key={code} value={code}>{REASON_LABELS[code] ?? code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="wastage-note">
              Note{needsNote ? " (required)" : " (optional)"}
            </Label>
            <Textarea
              id="wastage-note"
              value={reasonNote}
              onChange={(e) => setReasonNote(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="wastage-photo">Photo URL (recommended for high-value items)</Label>
            <Input id="wastage-photo" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} />
          </div>
          {estimatedCost != null ? (
            <p className="text-xs text-[var(--admin-muted)]">
              Estimated cost: {estimatedCost.toFixed(2)} EGP. Wastage above the clinic&apos;s
              threshold requires a second admin&apos;s approval before it&apos;s final.
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" disabled={pending || !canSave} onClick={onSave}>
            {pending ? "Logging…" : "Log wastage"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
