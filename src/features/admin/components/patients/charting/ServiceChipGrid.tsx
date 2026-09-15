"use client";

export type ServiceChipItem = {
  id: string;
  title: string;
  priceLabel: string | null;
};

type Props = {
  items: ServiceChipItem[];
  onAdd: (id: string) => void;
  selectedId?: string | null;
  variant?: "default" | "wizard";
};

export function ServiceChipGrid({
  items,
  onAdd,
  selectedId,
  variant = "default",
}: Props) {
  const wizard = variant === "wizard";
  return (
    <div className="mt-2 grid grid-cols-2 gap-2">
      {items.map((item) => {
        const selected = selectedId === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onAdd(item.id)}
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
              {item.title}
            </span>
            <span className="mt-0.5 block text-[10px] text-[#64748B]">
              {item.priceLabel ?? "No price on file"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
