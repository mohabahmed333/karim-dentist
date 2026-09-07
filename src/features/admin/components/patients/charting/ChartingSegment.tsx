"use client";

const track = "flex flex-wrap gap-0.5";
const pill = "rounded-full px-3 py-1.5 text-[12px] font-medium transition";

type Props<T extends string> = {
  value: T;
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
};

export function ChartingSegment<T extends string>({
  value,
  options,
  onChange,
}: Props<T>) {
  return (
    <div className={track}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={`${pill} ${
            value === option.id
              ? "bg-white text-[#1E293B] shadow-sm"
              : "text-[#64748B]"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export { pill as chartingPill };
