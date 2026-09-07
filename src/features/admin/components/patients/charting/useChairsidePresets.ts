"use client";

import { useEffect, useState } from "react";
import {
  moreMenuItems,
  resolveClinicMenu,
  type ClinicMenuItem,
} from "@/services/cdt";
import {
  listClinicCdtFees,
  listClinicTreatmentPresets,
  resolveChairsidePresets,
  type ChairsidePreset,
} from "@/services/clinic_fees";

export function useChairsidePresets() {
  const [presets, setPresets] = useState<ChairsidePreset[]>([]);
  const [moreItems, setMoreItems] = useState<ClinicMenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [fees, slots] = await Promise.all([
          listClinicCdtFees(),
          listClinicTreatmentPresets(),
        ]);
        if (cancelled) return;
        setPresets(resolveChairsidePresets(slots, fees));
        setMoreItems(moreMenuItems(resolveClinicMenu(fees), slots));
      } catch {
        if (!cancelled) {
          setPresets(resolveChairsidePresets([], []));
          setMoreItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { presets, moreItems, loading };
}
