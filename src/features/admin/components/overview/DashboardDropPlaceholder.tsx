import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** Compact bar for above/below; wider block for beside/slots. */
  compact?: boolean;
};

/** Empty drop target shown while dragging a dashboard widget. */
export function DashboardDropPlaceholder({
  className,
  compact = false,
}: Props) {
  return (
    <div
      aria-hidden
      className={cn(
        "rounded-md border-2 border-dashed border-[var(--admin-primary)]",
        "bg-[color:color-mix(in_oklab,var(--admin-primary)_10%,transparent)]",
        compact ? "h-3 w-full shrink-0" : "min-h-16 w-full flex-1",
        className,
      )}
    />
  );
}
