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
import { useLocale, useTranslations } from "@/lib/i18n";
import { logWastage } from "@/services/inventory/actions";
import { REASON_LABEL_KEYS, localizedItemName } from "@/services/inventory/i18nMaps";
import { WASTAGE_REASON_CODES, type InventoryItem } from "@/services/inventory/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  onSaved: () => void;
};

export function WastageLogDialog({ open, onOpenChange, item, onSaved }: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
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
      toast.success(t("admin.pages.inventory.wastage.success"));
      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("admin.pages.inventory.wastage.failed"));
    } finally {
      setPending(false);
    }
  }

  const canSave = Boolean(qty) && Number(qty) > 0 && (!needsNote || reasonNote.trim().length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("admin.pages.inventory.wastage.title").replace(
              "{item}",
              item ? localizedItemName(locale, item.name, item.name_ar) : "",
            )}
          </DialogTitle>
          <DialogDescription>{t("admin.pages.inventory.wastage.desc")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="wastage-qty">
              {t("admin.pages.inventory.wastage.qty").replace("{unit}", item?.unit ?? "")}
            </Label>
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
            <Label>{t("admin.pages.inventory.wastage.reason")}</Label>
            <Select value={reasonCode} onValueChange={setReasonCode}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {WASTAGE_REASON_CODES.map((code) => (
                  <SelectItem key={code} value={code}>{t(REASON_LABEL_KEYS[code])}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="wastage-note">
              {needsNote ? t("admin.pages.inventory.wastage.noteRequired") : t("admin.pages.inventory.wastage.noteOptional")}
            </Label>
            <Textarea
              id="wastage-note"
              value={reasonNote}
              onChange={(e) => setReasonNote(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="wastage-photo">{t("admin.pages.inventory.wastage.photo")}</Label>
            <Input id="wastage-photo" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} />
          </div>
          {estimatedCost != null ? (
            <p className="text-xs text-[var(--admin-muted)]">
              {t("admin.pages.inventory.wastage.estimatedCost").replace(
                "{cost}",
                estimatedCost.toFixed(2),
              )}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            {t("admin.cancel")}
          </Button>
          <Button type="button" variant="destructive" disabled={pending || !canSave} onClick={onSave}>
            {pending ? t("admin.pages.inventory.wastage.logging") : t("admin.pages.inventory.wastage.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
