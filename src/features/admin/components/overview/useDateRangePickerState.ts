"use client";

import { useEffect, useMemo, useState } from "react";
import {
  rangeFromPreset,
  type DateRange,
  type RangePresetId,
} from "@/features/admin/lib/dateRangeModel";

export function useDateRangePickerState(open: boolean, value: DateRange) {
  const [draft, setDraft] = useState<DateRange>(value);
  const [picking, setPicking] = useState<"start" | "end">("start");
  const [view, setView] = useState(
    () => new Date(value.start.getFullYear(), value.start.getMonth(), 1),
  );
  const [yearOpen, setYearOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<RangePresetId | "custom">(
    "today",
  );

  useEffect(() => {
    if (!open) return;
    setDraft(value);
    setView(new Date(value.start.getFullYear(), value.start.getMonth(), 1));
    setPicking("start");
    setYearOpen(false);
  }, [open, value]);

  const years = useMemo(() => {
    const y = new Date().getFullYear();
    return Array.from({ length: 20 }, (_, i) => y - 10 + i);
  }, []);

  function pickPreset(
    id: RangePresetId,
    onApply: (range: DateRange, presetId: RangePresetId | "custom") => void,
  ) {
    const next = rangeFromPreset(id);
    setDraft(next);
    setActivePreset(id);
    setView(new Date(next.start.getFullYear(), next.start.getMonth(), 1));
    setPicking("start");
    onApply(next, id);
  }

  function pickDay(
    day: Date,
    onApply: (range: DateRange, presetId: RangePresetId | "custom") => void,
  ) {
    setActivePreset("custom");
    if (picking === "start" || day < draft.start) {
      setDraft({ start: day, end: day });
      setPicking("end");
      return;
    }
    const next = { start: draft.start, end: day };
    setDraft(next);
    setPicking("start");
    onApply(next, "custom");
  }

  return {
    draft,
    setDraft,
    view,
    setView,
    yearOpen,
    setYearOpen,
    activePreset,
    years,
    pickPreset,
    pickDay,
  };
}
