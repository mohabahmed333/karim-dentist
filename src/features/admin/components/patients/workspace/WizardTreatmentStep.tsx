"use client";

import { useState } from "react";
import {
  chipLabelFor,
  isUrgentCdt,
  shortLabelFor,
} from "@/services/cdt";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CdtChipGrid } from "../charting/CdtChipGrid";
import { useChairsidePresets } from "../charting/useChairsidePresets";
import type { WizardDraft } from "./wizardModel";
import { WIZARD_CARD, WIZARD_INK, WIZARD_MUTE, WIZARD_SOFT } from "./wizardSkin";

type Props = {
  draft: WizardDraft;
  pending: boolean;
  onDraft: (next: WizardDraft) => void;
};

export function WizardTreatmentStep({ draft, pending, onDraft }: Props) {
  const { presets, moreItems, loading } = useChairsidePresets();
  const [showMore, setShowMore] = useState(false);

  const favoriteChips = presets.map((preset) => ({
    id: preset.id,
    label: preset.label,
    code: preset.code,
    fee: preset.fee,
  }));
  const extraChips = moreItems.map((item) => ({
    id: item.code,
    label: chipLabelFor(item.code),
    code: item.code,
    fee: item.fee,
  }));

  function pick(code: string, fee: number) {
    onDraft({
      ...draft,
      cdt_code: code,
      fee_amount: fee,
      severity: isUrgentCdt(code) ? "Critical" : draft.severity,
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className={`text-[13px] font-semibold ${WIZARD_INK}`}>
          Treatment
        </Label>
        <p className={`mt-0.5 text-[11px] ${WIZARD_SOFT}`}>
          From Settings → Clinic prices
        </p>
      </div>
      {loading && presets.length === 0 ? (
        <p className={`text-[12px] ${WIZARD_MUTE}`}>Loading treatments…</p>
      ) : (
        <>
          <CdtChipGrid
            items={showMore ? [...favoriteChips, ...extraChips] : favoriteChips}
            selectedCode={draft.cdt_code || null}
            onAdd={pick}
            variant="wizard"
          />
          {moreItems.length > 0 ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => setShowMore((value) => !value)}
              className={`${WIZARD_CARD} w-full px-2.5 py-2.5 text-[12px] font-semibold text-[#2563EB]`}
            >
              {showMore ? "Fewer treatments" : "More treatments"}
            </button>
          ) : null}
        </>
      )}
      {draft.cdt_code ? (
        <div className={`${WIZARD_CARD} p-3`}>
          <p className={`text-[12px] font-semibold ${WIZARD_INK}`}>
            {shortLabelFor(draft.cdt_code)}
            <span className={`ms-1 font-normal ${WIZARD_MUTE}`}>
              · {draft.cdt_code}
            </span>
          </p>
          <p className={`mt-1 text-[11px] ${WIZARD_MUTE}`}>
            Filled from Clinic prices — edit to override
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
