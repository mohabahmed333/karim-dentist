"use client";

import { useState } from "react";
import type { Service } from "@/services/services/types";
import { ServiceChipGrid } from "./ServiceChipGrid";

type Props = {
  toothLabel: string | null;
  hasTooth: boolean;
  services: Service[];
  onAdd: (service: Service) => void;
};

export function ServiceQuickPickChips({
  toothLabel,
  hasTooth,
  services,
  onAdd,
}: Props) {
  const [showMore, setShowMore] = useState(false);

  if (!hasTooth) {
    return (
      <p className="rounded-2xl border border-dashed border-[#CBD5E1] bg-[#EEF2F6] px-3 py-2.5 text-[12px] text-[#64748B]">
        Select a tooth on the middle chart, then tap a treatment.
      </p>
    );
  }

  const primary = services.slice(0, 4);
  const rest = services.slice(4);
  const byId = new Map(services.map((service) => [service.id, service]));

  return (
    <div className="rounded-2xl border border-[#2563EB]/20 bg-[#EEF2F6] p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
        {toothLabel ? `Tooth ${toothLabel}` : "Selected tooth"}
      </p>
      <ServiceChipGrid
        items={(showMore ? [...primary, ...rest] : primary).map((service) => ({
          id: service.id,
          title: service.title,
          priceLabel: service.price_label,
        }))}
        onAdd={(id) => {
          const service = byId.get(id);
          if (service) onAdd(service);
        }}
      />
      {rest.length > 0 ? (
        <button
          type="button"
          onClick={() => setShowMore((value) => !value)}
          className="mt-2 w-full rounded-xl border border-dashed border-[#2563EB]/40 bg-white px-2.5 py-2 text-[12px] font-semibold text-[#2563EB]"
        >
          {showMore ? "Fewer treatments" : "More treatments"}
        </button>
      ) : null}
    </div>
  );
}
