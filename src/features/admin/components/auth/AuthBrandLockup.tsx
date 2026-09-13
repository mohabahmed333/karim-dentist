import { cn } from "@/lib/utils";

type Props = {
  name: string;
  /** "light" sits on the brand-coloured panel, "brand" on the white form side. */
  tone?: "light" | "brand";
  className?: string;
};

/**
 * Monogram + wordmark, matching the "DL" badge the admin icon rail already
 * uses — there is no brand logo asset for the clinic (public/design/brand-logo.png
 * is the old agency mark), so the monogram is drawn rather than imported.
 */
export function AuthBrandLockup({ name, tone = "brand", className }: Props) {
  const light = tone === "light";
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold tracking-tight",
          light
            ? "bg-white/15 text-white ring-1 ring-white/25"
            : "bg-[var(--admin-primary,#5e6ad2)] text-white",
        )}
        aria-hidden="true"
      >
        DL
      </span>
      <span
        className={cn(
          "text-[15px] font-semibold tracking-tight",
          light ? "text-white" : "text-neutral-900",
        )}
      >
        {name}
      </span>
    </div>
  );
}
