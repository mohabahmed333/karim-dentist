"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type Props = {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export function PublishedField({ label, checked, onCheckedChange }: Props) {
  const id = `published-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(Boolean(value))}
      />
      <Label htmlFor={id} className="text-[12px] font-normal text-foreground">
        {label}
      </Label>
    </div>
  );
}
