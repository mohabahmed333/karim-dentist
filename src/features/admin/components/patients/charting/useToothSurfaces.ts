"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  applyPaint,
  emptySurfaces,
  listToothSurfaces,
  upsertToothSurfaces,
  type PaintTool,
  type PatientToothSurface,
  type SurfaceId,
  type SurfaceMap,
} from "@/services/tooth_surfaces";
import type { Dentition } from "@/services/notation";

function toMap(row: PatientToothSurface): SurfaceMap {
  return {
    mesial: row.mesial,
    distal: row.distal,
    occlusal: row.occlusal,
    facial: row.facial,
    lingual: row.lingual,
    whole: row.whole,
  };
}

export function useToothSurfaces(patientKey: string, dentition: Dentition) {
  const [rows, setRows] = useState<PatientToothSurface[]>([]);

  useEffect(() => {
    void listToothSurfaces(patientKey)
      .then(setRows)
      .catch(() => {
        if (document.documentElement.dataset.showreelDemo === "1") return;
        toast.error("Failed to load chart");
      });
  }, [patientKey]);

  const byFdi = useMemo(() => {
    const map = new Map<string, SurfaceMap>();
    for (const row of rows) map.set(row.fdi_number, toMap(row));
    return map;
  }, [rows]);

  async function paint(fdi: string, surface: SurfaceId, tool: PaintTool) {
    const current = byFdi.get(fdi) ?? emptySurfaces();
    const next = applyPaint(current, tool, surface);
    setRows((prev) => {
      const others = prev.filter((row) => row.fdi_number !== fdi);
      const existing = prev.find((row) => row.fdi_number === fdi);
      return [
        ...others,
        {
          id: existing?.id ?? fdi,
          patient_key: patientKey,
          fdi_number: fdi,
          dentition,
          created_at: existing?.created_at ?? new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...next,
        },
      ];
    });
    try {
      const saved = await upsertToothSurfaces(patientKey, {
        fdi_number: fdi,
        dentition,
        ...next,
      });
      setRows((prev) =>
        prev.map((row) => (row.fdi_number === fdi ? saved : row)),
      );
    } catch {
      toast.error("Failed to save chart");
    }
  }

  return { byFdi, paint };
}
