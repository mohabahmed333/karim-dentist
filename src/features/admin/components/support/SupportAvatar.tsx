import { cn } from "@/lib/utils";

type Props = {
  initials: string;
  color: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function SupportAvatar({
  initials,
  color,
  size = "md",
  className,
}: Props) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-[#1F2937]",
        size === "sm" ? "h-6 w-6" : size === "lg" ? "h-11 w-11 text-sm" : "h-9 w-9 text-xs",
        className,
      )}
      style={{ backgroundColor: color }}
    >
      {initials}
    </span>
  );
}
