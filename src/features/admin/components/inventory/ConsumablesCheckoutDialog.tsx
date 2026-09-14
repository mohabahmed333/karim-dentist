"use client";

import { useState } from "react";
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
import type { ConsumableUsage, ServiceRecipeWithItem } from "@/services/inventory/types";

type Props = {
  open: boolean;
  recipes: ServiceRecipeWithItem[];
  pending?: boolean;
  onConfirm: (usages: ConsumableUsage[]) => void;
  onCancel: () => void;
};

/**
 * The unskippable step before a variable-consumable service (Botox, bone
 * graft) can be marked complete — the loss-prevention point this whole
 * module exists for. No close button, no backdrop dismiss: onOpenChange
 * only fires cancel, and Confirm stays disabled until every row has a
 * quantity greater than zero.
 */
export function ConsumablesCheckoutDialog({
  open,
  recipes,
  pending = false,
  onConfirm,
  onCancel,
}: Props) {
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  // Reseed quantities from the recipe defaults whenever a new checkout
  // opens, using React's "adjust state during render" pattern instead of an
  // effect — the dialog's own open/close cadence IS the reset signal, so
  // there is nothing here to synchronize with an external system.
  const [seededFor, setSeededFor] = useState<string | null>(null);
  const openKey = open ? recipes.map((r) => r.item_id).join(",") : null;
  if (open && openKey !== seededFor) {
    setSeededFor(openKey);
    setQuantities(Object.fromEntries(recipes.map((r) => [r.item_id, String(r.default_qty)])));
  }

  const parsedUsages: ConsumableUsage[] = recipes.map((r) => ({
    item_id: r.item_id,
    qty_used: Number(quantities[r.item_id]),
  }));
  const canConfirm = parsedUsages.every((u) => Number.isFinite(u.qty_used) && u.qty_used > 0);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Confirm consumables used</DialogTitle>
          <DialogDescription>
            Enter exactly what was used for this visit before it can be marked complete.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          {recipes.map((recipe) => (
            <div key={recipe.item_id} className="flex items-center justify-between gap-3">
              <Label htmlFor={`qty-${recipe.item_id}`} className="flex-1">
                {recipe.item.name}
                <span className="text-muted-foreground ml-1 text-xs">
                  ({recipe.item.unit})
                </span>
              </Label>
              <Input
                id={`qty-${recipe.item_id}`}
                type="number"
                step="0.01"
                min="0"
                className="w-28"
                value={quantities[recipe.item_id] ?? ""}
                onChange={(e) =>
                  setQuantities((prev) => ({ ...prev, [recipe.item_id]: e.target.value }))
                }
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={pending} onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={pending || !canConfirm}
            onClick={() => onConfirm(parsedUsages)}
          >
            {pending ? "Completing…" : "Confirm & Complete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
