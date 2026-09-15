"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = React.ComponentProps<typeof Input> & {
  containerClassName?: string;
};

/** The rounded-pill search field used by the top-bar search — shared so
 * every dropdown/search box in the admin looks and feels the same. */
export function AdminSearchInput({
  className,
  containerClassName,
  ...props
}: Props) {
  return (
    <div className={cn("relative flex items-center", containerClassName)}>
      <Search
        aria-hidden
        className="pointer-events-none absolute start-3 size-3.5 shrink-0 text-[var(--admin-muted,#9ca3af)]"
      />
      <Input
        data-admin-field=""
        className={cn(
          "h-9 w-full rounded-full border border-[var(--admin-border,#e5e7eb)] bg-[var(--admin-panel,#fff)] ps-9 pe-3 text-sm text-[var(--admin-text,#1a1a1a)] shadow-none outline-none transition-colors placeholder:text-[var(--admin-muted,#9ca3af)] focus-visible:border-[var(--admin-muted,#d1d5db)] focus-visible:ring-2 focus-visible:ring-[var(--admin-border,#e5e7eb)] disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    </div>
  );
}
