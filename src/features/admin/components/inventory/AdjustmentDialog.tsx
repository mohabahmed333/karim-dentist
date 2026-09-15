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
import { useLocale, useTranslations } from "@/lib/i18n";
import { recordAdjustment } from "@/services/inventory/actions";
import { localizedItemName } from "@/services/inventory/i18nMaps";
import type { InventoryItem } from "@/services/inventory/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  onSaved: () => void;
};

/** A manual recount correction — up or down. Always requires a note; a
 * large negative correction is exactly the shrinkage signal this module
 * exists to catch, so it draws through the same dual-control threshold as
 * wastage (see consume_inventory_stock). */
export function AdjustmentDialog({ open, onOpenChange, item, onSaved }: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  const [pending, setPending] = useState(false);
  const [delta, setDelta] = useState("");
  const [note, setNote] = useState("");

  const [seededFor, setSeededFor] = useState<string | null>(null);
  const key = open ? (item?.id ?? null) : null;
  if (open && key !== seededFor) {
    setSeededFor(key);
    setDelta("");
    setNote("");
  }

  async function onSave() {
    if (!item) return;
    setPending(true);
    try {
      await recordAdjustment({
        item_id: item.id,
        qty_delta: Number(delta),
        reason_note: note,
      });
      toast.success(t("admin.pages.inventory.adjustment.success"));
      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("admin.pages.inventory.adjustment.failed"));
    } finally {
      setPending(false);
    }
  }

  const canSave = delta !== "" && Number(delta) !== 0 && note.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("admin.pages.inventory.adjustment.title").replace(
              "{item}",
              item ? localizedItemName(locale, item.name, item.name_ar) : "",
            )}
          </DialogTitle>
          <DialogDescription>{t("admin.pages.inventory.adjustment.desc")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="adj-delta">
              {t("admin.pages.inventory.adjustment.qty").replace("{unit}", item?.unit ?? "")}
            </Label>
            <Input
              id="adj-delta"
              type="number"
              step="0.01"
              placeholder={t("admin.pages.inventory.adjustment.qtyPlaceholder")}
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="adj-note">{t("admin.pages.inventory.adjustment.note")}</Label>
            <Textarea id="adj-note" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            {t("admin.cancel")}
          </Button>
          <Button type="button" disabled={pending || !canSave} onClick={onSave}>
            {pending ? t("admin.saving") : t("admin.pages.inventory.adjustment.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
