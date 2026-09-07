"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
};

export function YearField({
  label = "Year",
  value,
  onChange,
  min = 1990,
  max = new Date().getFullYear() + 2,
}: Props) {
  const id = "customize-year";

  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-[11px] text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        placeholder="YYYY"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 rounded-[4px] shadow-none tabular-nums"
      />
    </div>
  );
}
