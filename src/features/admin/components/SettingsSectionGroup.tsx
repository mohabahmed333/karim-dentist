import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Small uppercase section label + body, shared across all Settings sub-pages. */
export function SettingsSectionGroup({
  title,
  hint,
  children,
  className,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="space-y-0.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--admin-muted)]">
          {title}
        </p>
        {hint ? (
          <p className="text-[12px] text-[var(--admin-muted)]">{hint}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

/** Callout banner for a page's intro hint text. */
export function SettingsHintBanner({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-hover)] px-3.5 py-2.5 text-sm text-[var(--admin-muted)]">
      {children}
    </p>
  );
}

/** Divider + action row, placed above the page's primary save button. */
export function SettingsSaveRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 border-t border-[var(--admin-border)] pt-5">
      {children}
    </div>
  );
}
