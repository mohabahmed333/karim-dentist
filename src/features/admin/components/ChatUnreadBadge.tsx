import { cn } from "@/lib/utils";

type Props = {
  label: string | null;
  className?: string;
};

export function ChatUnreadBadge({ label, className }: Props) {
  if (!label) return null;
  return (
    <span
      aria-hidden
      className={cn(
        "absolute -top-0.5 -end-0.5 z-[1] flex h-4 min-w-4 items-center justify-center rounded-full px-1",
        "bg-[#DC2626] text-[9px] font-bold leading-none text-white",
        "ring-2 ring-[var(--admin-panel)]",
        className,
      )}
    >
      {label}
    </span>
  );
}
