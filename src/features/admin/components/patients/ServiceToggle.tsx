"use client";

export type ServiceFilter = "medical" | "cosmetic";

type Props = {
  value: ServiceFilter;
  onChange: (value: ServiceFilter) => void;
};

export function ServiceToggle({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-[#374151]">Service</span>
      <div className="inline-flex rounded-full bg-[#f3f4f6] p-1">
        {(["medical", "cosmetic"] as const).map((option) => {
          const active = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={
                active
                  ? "rounded-full bg-white px-4 py-1.5 text-sm font-medium text-[#111827] shadow-sm"
                  : "rounded-full px-4 py-1.5 text-sm font-medium text-[#6b7280] hover:text-[#374151]"
              }
            >
              {option === "medical" ? "Medical" : "Cosmetic"}
            </button>
          );
        })}
      </div>
    </div>
  );
}
