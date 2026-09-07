"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { chipLabelFor } from "@/services/cdt";
import {
  defaultPresetSlots,
  deleteClinicCdtFee,
  saveClinicTreatmentPresets,
  upsertClinicCdtFee,
} from "@/services/clinic_fees";
import type { FeeDraft, PresetDraft } from "./clinicFeesDrafts";
import { loadClinicFeeDrafts } from "./loadClinicFeeDrafts";

export type { FeeDraft, PresetDraft };

export function useClinicFeesEditor() {
  const [fees, setFees] = useState<FeeDraft[]>([]);
  const [presets, setPresets] = useState<PresetDraft[]>(defaultPresetSlots);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [removeCode, setRemoveCode] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadClinicFeeDrafts()
      .then((draft) => {
        if (cancelled) return;
        setFees(draft.fees);
        if (draft.presets) setPresets(draft.presets);
      })
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : "Failed to load fees");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function persistFee(code: string, feeEgp: number) {
    setPending(true);
    try {
      await upsertClinicCdtFee(code, feeEgp);
      toast.success("Price saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  async function onAdd(code: string) {
    setFees((prev) =>
      prev.some((row) => row.code === code)
        ? prev
        : [...prev, { code, fee_egp: 0 }],
    );
    await persistFee(code, 0);
  }

  async function onPresetChange(slot: number, code: string) {
    const next = presets.map((row) =>
      row.slot === slot ? { slot, code, label: chipLabelFor(code) } : row,
    );
    setPresets(next);
    setPending(true);
    try {
      await saveClinicTreatmentPresets(next);
      toast.success("Favorite saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  async function confirmRemove() {
    if (!removeCode) return;
    setPending(true);
    try {
      await deleteClinicCdtFee(removeCode);
      setFees((prev) => prev.filter((row) => row.code !== removeCode));
      setRemoveCode(null);
      toast.success("Removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setPending(false);
    }
  }

  return {
    fees,
    presets,
    pending,
    loading,
    removeCode,
    setRemoveCode,
    setFees,
    persistFee,
    onAdd,
    onPresetChange,
    confirmRemove,
  };
}
