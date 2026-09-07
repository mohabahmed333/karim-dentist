"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { imagingForFdi } from "@/services/patient_imaging/match";
import {
  createPatientImaging,
  imagingCreateSchema,
  uploadPatientImagingFile,
  type PatientImaging,
} from "@/services/patient_imaging";
import { universalForFdi } from "@/services/notation";
import { ImagingEmpty } from "./ImagingEmpty";

type Props = {
  patientKey: string;
  fdi: string;
  items: PatientImaging[];
  onUploaded: (row: PatientImaging) => void;
};

export function ImagingLightbox({ patientKey, fdi, items, onUploaded }: Props) {
  const linked = useMemo(() => imagingForFdi(items, fdi), [items, fdi]);
  const [index, setIndex] = useState(0);
  const [invert, setInvert] = useState(false);
  const [zoom, setZoom] = useState(1);
  const current = linked[Math.min(index, Math.max(linked.length - 1, 0))];

  async function onFile(file: File) {
    try {
      const uploaded = await uploadPatientImagingFile(patientKey, file);
      const uni = universalForFdi(fdi);
      const parsed = imagingCreateSchema.parse({
        title: `PA · ${fdi}`,
        kind: "xray",
        tooth_fdi: fdi,
        tooth_number: typeof uni === "number" ? uni : null,
        file_url: uploaded.file_url,
        file_name: uploaded.file_name,
        mime_type: uploaded.mime_type,
      });
      onUploaded(await createPatientImaging(patientKey, parsed));
      toast.success("Radiograph uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  }

  if (!current) return <ImagingEmpty onFile={(file) => void onFile(file)} />;

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#111111]">
        {current.mime_type.startsWith("image/") ? (
          <Image
            src={current.file_url}
            alt={current.title}
            fill
            unoptimized
            className="object-contain"
            style={{
              filter: invert ? "invert(1)" : undefined,
              transform: `scale(${zoom})`,
            }}
          />
        ) : (
          <iframe title={current.title} src={current.file_url} className="h-full w-full" />
        )}
      </div>
      <p className="text-xs text-[#6b7280]">{current.title}</p>
      <div className="flex flex-wrap gap-2 text-xs text-[#2563eb]">
        <button type="button" onClick={() => setInvert((v) => !v)}>Invert</button>
        <button type="button" onClick={() => setZoom((z) => Math.min(3, z + 0.25))}>Zoom +</button>
        <button type="button" onClick={() => setZoom((z) => Math.max(1, z - 0.25))}>Zoom −</button>
        <button type="button" disabled={index <= 0} onClick={() => setIndex((i) => i - 1)}>Prev</button>
        <button type="button" disabled={index >= linked.length - 1} onClick={() => setIndex((i) => i + 1)}>Next</button>
      </div>
    </div>
  );
}
