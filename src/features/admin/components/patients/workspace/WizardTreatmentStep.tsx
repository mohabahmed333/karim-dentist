"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Service } from "@/services/services/types";
import { ServiceChipGrid } from "../charting/ServiceChipGrid";
import type { WizardDraft } from "./wizardModel";
import { WIZARD_CARD, WIZARD_INK, WIZARD_MUTE, WIZARD_SOFT } from "./wizardSkin";

type Props = {
  draft: WizardDraft;
  pending: boolean;
  services: Service[];
  onDraft: (next: WizardDraft) => void;
};

export function WizardTreatmentStep({ draft, pending, services, onDraft }: Props) {
  const [showMore, setShowMore] = useState(false);

  const primary = services.slice(0, 4);
  const rest = services.slice(4);
  const byId = new Map(services.map((service) => [service.id, service]));

  function pickService(service: Service) {
    onDraft({
      ...draft,
      cdt_code: "",
      fee_amount: service.price_min_egp ?? 0,
      last_treatment: service.title,
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className={`text-[13px] font-semibold ${WIZARD_INK}`}>
          Treatment
        </Label>
        <p className={`mt-0.5 text-[11px] ${WIZARD_SOFT}`}>
          From Settings → Prices
        </p>
      </div>
      <ServiceChipGrid
        items={(showMore ? [...primary, ...rest] : primary).map((service) => ({
          id: service.id,
          title: service.title,
          priceLabel: service.price_label,
        }))}
        selectedId={draft.last_treatment ? (services.find((s) => s.title === draft.last_treatment)?.id ?? null) : null}
        onAdd={(id) => {
          const service = byId.get(id);
          if (service) pickService(service);
        }}
        variant="wizard"
      />
      {rest.length > 0 ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => setShowMore((value) => !value)}
          className={`${WIZARD_CARD} w-full px-2.5 py-2.5 text-[12px] font-semibold text-[#2563EB]`}
        >
          {showMore ? "Fewer treatments" : "More treatments"}
        </button>
      ) : null}
      {draft.last_treatment ? (
        <div className={`${WIZARD_CARD} p-3`}>
          <p className={`text-[12px] font-semibold ${WIZARD_INK}`}>
            {draft.last_treatment}
          </p>
          <p className={`mt-1 text-[11px] ${WIZARD_MUTE}`}>
            Filled from Prices — edit to override
          </p>
          <div className="mt-3 grid gap-1.5">
            <Label htmlFor="wizard-fee" className={`font-semibold ${WIZARD_INK}`}>
              Fee (EGP)
            </Label>
            <Input
              id="wizard-fee"
              inputMode="numeric"
              disabled={pending}
              value={draft.fee_amount === 0 ? "" : String(draft.fee_amount)}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^\d]/g, "");
                onDraft({
                  ...draft,
                  fee_amount: raw === "" ? 0 : Number.parseInt(raw, 10),
                });
              }}
              placeholder="0"
              className="h-11 rounded-lg border-[#E2E8F0] bg-white"
            />
          </div>
        </div>
      ) : (
        <p className={`text-[12px] ${WIZARD_SOFT}`}>
          Select a treatment to continue.
        </p>
      )}
    </div>
  );
}
