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
          ? "bg-[#FEE2E2] text-[#991B1B]"
          : "bg-[#F3F4F6] text-[#374151]",
        className,
      )}
    >
      {label}
    </span>
  );
}
