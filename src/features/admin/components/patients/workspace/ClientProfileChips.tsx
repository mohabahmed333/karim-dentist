"use client";

type Props = {
  options: readonly string[] | { value: string; label: string }[];
  selected: string | string[];
  onToggle: (value: string) => void;
  readOnly?: boolean;
};

export function ClientProfileChips({
  options,
  selected,
  onToggle,
  readOnly,
}: Props) {
  const active = new Set(
    Array.isArray(selected) ? selected : selected ? [selected] : [],
  );

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const value = typeof option === "string" ? option : option.value;
        const label = typeof option === "string" ? option : option.label;
        const on = active.has(value);
        return (
          <button
            key={value}
            type="button"
            disabled={readOnly}
            onClick={() => onToggle(value)}
            className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              on
                ? "border-[#111111] bg-[#111111] text-white"
                : "border-[#E8EAED] bg-white text-[#111111]"
            } ${
              readOnly
                ? "cursor-default opacity-90"
                : "hover:border-[#C5C9D2]"
            } disabled:pointer-events-none`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
