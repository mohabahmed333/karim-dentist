"use client";

import { useEffect, useState } from "react";
import type { Dentition, NotationSystem } from "@/services/notation";
import type { PaintTool } from "@/services/tooth_surfaces";

export type DiagTab = "imaging" | "vitality" | "perio" | "soap";

const RATE_PCTS = new Set([0, 10, 20]);

function insuranceKey(patientKey: string) {
  return `charting.insurancePct:${patientKey}`;
}

export function useChartingSession(patientKey: string) {
  const [dentition, setDentition] = useState<Dentition>("adult");
  const [notation, setNotation] = useState<NotationSystem>("fdi");
  const [paintTool, setPaintTool] = useState<PaintTool>("select");
  const [diagTab, setDiagTab] = useState<DiagTab>("imaging");
  const [insurancePct, setInsurancePctState] = useState(0);

  useEffect(() => {
    const raw = window.localStorage.getItem(insuranceKey(patientKey));
    const parsed = raw ? Number.parseInt(raw, 10) : 0;
    setInsurancePctState(RATE_PCTS.has(parsed) ? parsed : 0);
  }, [patientKey]);

  function setInsurancePct(value: number) {
    const next = RATE_PCTS.has(value) ? value : 0;
    setInsurancePctState(next);
    window.localStorage.setItem(insuranceKey(patientKey), String(next));
  }

  return {
    dentition,
    setDentition,
    notation,
    setNotation,
    paintTool,
    setPaintTool,
    diagTab,
    setDiagTab,
    insurancePct,
    setInsurancePct,
  };
}
