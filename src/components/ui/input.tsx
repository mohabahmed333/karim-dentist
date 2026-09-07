import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-lg border border-[var(--admin-border,#e5e7eb)] bg-[var(--admin-panel,#fff)] px-3 py-1 text-sm text-[var(--admin-text,#1a1a1a)] shadow-none transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-[var(--admin-muted,#9ca3af)] focus-visible:border-[var(--admin-border,#d1d5db)] focus-visible:ring-2 focus-visible:ring-[var(--admin-border,#e5e7eb)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
