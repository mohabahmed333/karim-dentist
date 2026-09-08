"use client";

import {
  AdminDropdownMenu,
  AdminDropdownMenuContent,
  AdminDropdownMenuItem,
  AdminDropdownMenuTrigger,
} from "@/features/admin/ui";

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
};

export function BentoMenu<T extends string>({
  label,
  value,
  options,
  onChange,
}: Props<T>) {
  const active = options.find((item) => item.value === value)?.label ?? label;
  return (
    <AdminDropdownMenu>
      <AdminDropdownMenuTrigger className="flex items-center gap-1 text-[12px] text-[#111111]">
        {active}
      </AdminDropdownMenuTrigger>
      <AdminDropdownMenuContent align="end">
        {options.map((option) => (
          <AdminDropdownMenuItem
            key={option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </AdminDropdownMenuItem>
        ))}
      </AdminDropdownMenuContent>
    </AdminDropdownMenu>
  );
}
