"use client";

export type ChipAddItem = {
  id: string;
  label: string;
  code: string;
  fee: number;
};

type Props = {
  items: ChipAddItem[];
  onAdd: (code: string, fee: number) => void;
  selectedCode?: string | null;
  variant?: "default" | "wizard";
};

export function CdtChipGrid({
  items,
  onAdd,
  selectedCode,
  variant = "default",
}: Props) {
  const wizard = variant === "wizard";
  return (
    <div className="mt-2 grid grid-cols-2 gap-2">
      {items.map((item) => {
        const selected = selectedCode === item.code;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onAdd(item.code, item.fee)}
            className={`rounded-lg border px-2.5 py-2.5 text-start ${
              wizard
                ? selected
                  ? "border-[#111111] bg-white ring-1 ring-[#111111]/25"
                  : "border-[#E8EAED] bg-white hover:border-[#C5C9D2]"
                : selected
                  ? "border-[#111111] bg-white ring-1 ring-[#111111]/25"
                  : "border-[#E8EAED] bg-[#F8F9FB] hover:border-[#C5C9D2]"
            }`}
          >
            <span className="block text-[12px] font-semibold text-[#1E293B]">
              {item.label}
            </span>
            <span className="mt-0.5 block text-[10px] text-[#64748B]">
              {item.code}
            </span>
          </button>
        );
      })}
    </div>
  );
}
