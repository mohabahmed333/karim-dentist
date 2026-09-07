"use client";

import { useMemo, useState } from "react";
import type { PatientImaging } from "@/services/patient_imaging";
import type { PatientToothNote } from "@/services/patient_tooth_notes";
import type { TreatmentItem } from "@/services/patient_treatments";
import type { PatientGroup } from "@/services/reservations/patientHistory";
import { UNIVERSAL_TO_FDI } from "./ehr.types";
import { buildEhrModel } from "./buildEhrModel";
import { linkedMediaFor } from "./ehrScene";
import { buildTreatmentPropNodes } from "./treatmentProps";

type Props = {
  group: PatientGroup;
  treatments: TreatmentItem[];
  imaging: PatientImaging[];
  notes: PatientToothNote[];
};

export function useEhrSession({ group, treatments, imaging, notes }: Props) {
  const model = useMemo(
    () => buildEhrModel(treatments, group, imaging, notes),
    [treatments, group, imaging, notes],
  );
  const [conditionId, setConditionId] = useState(
    model.conditions[0]?.id ?? null,
  );
  const [selectedToothId, setSelectedToothId] = useState<number | null>(
    model.conditions[0]?.toothUniversal ?? null,
  );
  const [visitId, setVisitId] = useState(model.visits.at(-1)?.id ?? null);
  const [expandedTx, setExpandedTx] = useState(true);
  const [archFlip, setArchFlip] = useState(false);

  const activeCondition =
    model.conditions.find((c) => c.id === conditionId) ??
    model.conditions[0] ??
    null;
  const activeVisit =
    model.visits.find((v) => v.id === visitId) ?? model.visits.at(-1) ?? null;
  const activeTreatment =
    treatments.find((t) => t.id === activeCondition?.id) ?? null;
  const activeFdi =
    activeCondition?.fdi ??
    (selectedToothId != null ? UNIVERSAL_TO_FDI[selectedToothId] : undefined);
  const sceneNotes = useMemo(() => {
    const scoped = activeFdi
      ? notes.filter((n) => n.fdi_number === activeFdi)
      : notes;
    return scoped.slice(0, 4);
  }, [notes, activeFdi]);

  function selectTooth(universal: number) {
    setSelectedToothId(universal);
    setExpandedTx(true);
    const match = model.conditions.find((c) => c.toothUniversal === universal);
    if (match) setConditionId(match.id);
  }

  function selectCondition(id: string, toothUniversal: number | null) {
    setConditionId(id);
    setSelectedToothId(toothUniversal);
    setExpandedTx(true);
  }

  return {
    model,
    activeCondition,
    activeVisit,
    activeTreatment,
    activeFdi,
    sceneNotes,
    selectedToothId,
    expandedTx,
    archFlip,
    propNodes: activeTreatment
      ? buildTreatmentPropNodes(activeTreatment)
      : [],
    linkedMedia: linkedMediaFor(
      activeTreatment,
      activeVisit?.id,
      model.media,
    ),
    setVisitId,
    setExpandedTx,
    setArchFlip,
    selectTooth,
    selectCondition,
  };
}
