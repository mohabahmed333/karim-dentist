"use client";

import { DashboardDateRangePicker } from "@/features/admin/components/overview/DashboardDateRangePicker";
import { DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import type { DateRange, RangePresetId } from "@/features/admin/lib/dateRangeModel";

type Props = {
  range: DateRange;
  onApply: (range: DateRange, presetId: RangePresetId | "custom") => void;
};

export function FilterMenuDatePanel({ range, onApply }: Props) {
  return (
    <DropdownMenuSubContent
      align="start"
      side="inline-end"
      sideOffset={6}
      className="w-auto min-w-0 overflow-visible rounded-xl border border-[var(--admin-border,#e6e6e6)] bg-[var(--admin-panel,#ffffff)] p-0"
    >
      <DashboardDateRangePicker
        open
        placement="inline"
        value={range}
        onClose={() => undefined}
        onApply={onApply}
      />
    </DropdownMenuSubContent>
  );
}
