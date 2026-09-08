"use client";

import { SlidersHorizontal } from "lucide-react";
import {
  AdminDropdownMenu,
  AdminDropdownMenuCheckboxItem,
  AdminDropdownMenuContent,
  AdminDropdownMenuTrigger,
} from "@/features/admin/ui";
import { type VisitCategory, VISIT_CATEGORIES } from "@/services/dental_chart/bento";

type Props = {
  selected: VisitCategory[];
  onChange: (categories: VisitCategory[]) => void;
};

const LABELS: Record<VisitCategory, string> = {
  HYGIENE: "Hygiene / Cleaning",
  ENDODONTIC: "Endodontic",
  SURGICAL: "Surgical",
  ORTHODONTIC: "Orthodontic",
  EMERGENCY: "Emergency",
};

export function VisitFilterMenu({ selected, onChange }: Props) {
  function toggle(category: VisitCategory) {
    const set = new Set(selected);
    if (set.has(category)) set.delete(category);
    else set.add(category);
    onChange([...set]);
  }

  return (
    <AdminDropdownMenu>
      <AdminDropdownMenuTrigger className="flex size-7 items-center justify-center rounded-full bg-[#111111] text-white">
        <SlidersHorizontal className="size-3" />
      </AdminDropdownMenuTrigger>
      <AdminDropdownMenuContent align="end">
        {VISIT_CATEGORIES.map((category) => (
          <AdminDropdownMenuCheckboxItem
            key={category}
            checked={selected.includes(category)}
            onCheckedChange={() => toggle(category)}
          >
            {LABELS[category]}
          </AdminDropdownMenuCheckboxItem>
        ))}
      </AdminDropdownMenuContent>
    </AdminDropdownMenu>
  );
}
