import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full rounded-lg border border-[var(--admin-border,#e5e7eb)] bg-[var(--admin-panel,#fff)] px-3 py-2 text-sm text-[var(--admin-text,#1a1a1a)] shadow-none transition-colors outline-none placeholder:text-[var(--admin-muted,#9ca3af)] focus-visible:border-[var(--admin-border,#d1d5db)] focus-visible:ring-2 focus-visible:ring-[var(--admin-border,#e5e7eb)] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
