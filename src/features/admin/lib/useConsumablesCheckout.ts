"use client";

import { useState } from "react";
import { listRecipesForService } from "@/services/inventory/queries";
import type { ConsumableUsage, ServiceRecipeWithItem } from "@/services/inventory/types";

/**
 * The mandatory checkout step at appointment/treatment completion.
 *
 * `requireCheckout(serviceId)` resolves immediately with `[]` when the
 * service has no `kind: 'variable'` recipe rows (nothing to prompt for —
 * any fixed rows still deduct, silently, inside completeReservation /
 * completeTreatment). When it does have variable rows, it opens the dialog
 * and suspends until the user confirms quantities or cancels (`null`).
 *
 * This is a UX convenience only — the real enforcement (a missing/zero
 * qty_used for a required variable item) happens server-side in
 * deductRecipeForCompletion, so a caller that skips this hook entirely
 * still cannot silently skip the deduction.
 */
export function useConsumablesCheckout() {
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<ServiceRecipeWithItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolver, setResolver] = useState<
    ((usages: ConsumableUsage[] | null) => void) | null
  >(null);

  async function requireCheckout(
    targetServiceId: string | null,
  ): Promise<ConsumableUsage[] | null> {
    if (!targetServiceId) return [];
    setLoading(true);
    let all: ServiceRecipeWithItem[] = [];
    try {
      all = await listRecipesForService(targetServiceId);
    } finally {
      setLoading(false);
    }
    const variable = all.filter((r) => r.kind === "variable");
    if (variable.length === 0) return [];

    setRecipes(variable);
    setServiceId(targetServiceId);
    return new Promise<ConsumableUsage[] | null>((resolve) => {
      setResolver(() => resolve);
    });
  }

  function confirm(usages: ConsumableUsage[]) {
    resolver?.(usages);
    reset();
  }

  function cancel() {
    resolver?.(null);
    reset();
  }

  function reset() {
    setServiceId(null);
    setRecipes([]);
    setResolver(null);
  }

  return {
    requireCheckout,
    loading,
    dialogProps: {
      open: Boolean(serviceId),
      recipes,
      onConfirm: confirm,
      onCancel: cancel,
    },
  };
}
