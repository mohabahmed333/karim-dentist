import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * A loading placeholder that is actually visible on the admin screens.
 *
 * The UI kit's skeleton fills with `bg-muted`, which resolves to white in the
 * admin theme, so its bars disappear against the panels. This takes its fill
 * from the admin palette instead. Purely decorative: the region using it should
 * carry `aria-busy` and a screen-reader line saying what is loading.
 */
export function AdminSkeleton({ className }: { className?: string }) {
  return <Skeleton aria-hidden className={cn("bg-[var(--admin-border,#e6e6e6)]", className)} />;
}
