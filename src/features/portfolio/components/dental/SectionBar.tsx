import { cn } from "@/lib/utils";

type SectionBarProps = {
  label: string;
  number: string;
  className?: string;
  labelField?: string;
};

export function SectionBar({
  label,
  number,
  className,
  labelField,
}: SectionBarProps) {
  return (
    <div
      className={cn(
        "mb-8 flex items-center justify-between gap-4",
        className,
      )}
    >
      <span
        className="inline-flex min-h-9 items-center rounded-full border border-[#e6e8ec] px-[0.95rem] py-[0.45rem] text-[0.92rem] font-medium text-[#6b7280]"
        data-customize-field={labelField}
      >
        {label}
      </span>
      {number ? <span className="text-sm text-[#6b7280]">{number}</span> : null}
    </div>
  );
}
