import { cn } from "@/lib/utils";
import type { SupportTagTone } from "./supportDummyData";

type Props = {
  label: string;
  tone?: SupportTagTone;
  className?: string;
};

export function SupportTag({ label, tone = "neutral", className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        tone === "danger"
          ? "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300"
          : "bg-[var(--admin-hover)] text-[var(--admin-text)]",
        className,
      )}
    >
      {label}
    </span>
  );
}
