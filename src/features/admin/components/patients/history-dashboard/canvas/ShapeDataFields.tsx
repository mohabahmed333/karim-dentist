"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isSchemaShape } from "./shapeRegistry";
import type { ShapeFormState } from "./shapeForm";
import type { MediaFile } from "./canvas.types";
import { MediaGridUploadFields } from "./MediaGridUploadFields";

type Props = {
  shapeType: string;
  form: ShapeFormState;
  onChange: (patch: Partial<ShapeFormState>) => void;
  mediaFiles?: MediaFile[];
  onMediaFiles?: (files: MediaFile[]) => void;
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] text-[#111111]/65">{label}</Label>
      {children}
    </div>
  );
}

export function ShapeDataFields({ shapeType, form, onChange, mediaFiles = [], onMediaFiles }: Props) {
  const set = (key: keyof ShapeFormState, value: string) => onChange({ [key]: value });

  if (shapeType === "SHAPE_03") {
    return (
      <div className="space-y-3">
        <Field label="Tooth #">
          <Input
            value={form.toothNumber}
            onChange={(e) => set("toothNumber", e.target.value)}
            className="rounded-xl bg-white"
          />
        </Field>
        <MediaGridUploadFields
          value={mediaFiles}
          onChange={(files) => onMediaFiles?.(files)}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Visit type">
        <Input
          value={form.visitType}
          onChange={(e) => set("visitType", e.target.value)}
          placeholder="Office Visit"
          className="rounded-xl bg-white"
        />
      </Field>

      {(shapeType === "SHAPE_05" || shapeType === "SHAPE_06" || isSchemaShape(shapeType)) && (
        <Field label="Date badge">
          <Input
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
            placeholder="07.10"
            className="rounded-xl bg-white"
          />
        </Field>
      )}

      {(shapeType === "SHAPE_02" || shapeType === "SHAPE_03") && (
        <>
          <Field label="Tooth #">
            <Input
              value={form.toothNumber}
              onChange={(e) => set("toothNumber", e.target.value)}
              className="rounded-xl bg-white"
            />
          </Field>
          {shapeType === "SHAPE_02" && (
            <Field label="Vitality metric">
              <Input
                value={form.metric}
                onChange={(e) => set("metric", e.target.value)}
                className="rounded-xl bg-white"
              />
            </Field>
          )}
        </>
      )}

      {shapeType === "SHAPE_06" && (
        <>
          {(["perioM", "perioB", "perioD", "perioL"] as const).map((key, index) => (
            <Field key={key} label={`Pocket depth ${["Mesial", "Buccal", "Distal", "Lingual"][index]} (mm)`}>
              <Input
                value={form[key]}
                onChange={(e) => onChange({ [key]: e.target.value })}
                className="rounded-xl bg-white"
              />
            </Field>
          ))}
        </>
      )}

      {shapeType === "SHAPE_07" && (
        <Field label="Lab progress (%)">
          <Input
            value={form.progressPercent}
            onChange={(e) => set("progressPercent", e.target.value)}
            className="rounded-xl bg-white"
          />
        </Field>
      )}

      {shapeType === "SHAPE_08" && (
        <>
          <Field label="Drug 1">
            <Input value={form.drug1} onChange={(e) => set("drug1", e.target.value)} className="rounded-xl bg-white" />
          </Field>
          <Field label="Drug 1 timing">
            <Select value={form.drug1Timing} onValueChange={(v) => onChange({ drug1Timing: v as ShapeFormState["drug1Timing"] })}>
              <SelectTrigger className="w-full rounded-xl"><SelectValue placeholder="Timing" /></SelectTrigger>
              <SelectContent className="z-(--z-popover)">
                <SelectItem value="day">☀️ Day</SelectItem>
                <SelectItem value="night">🌙 Night</SelectItem>
                <SelectItem value="both">☀️🌙 Both</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Drug 2">
            <Input value={form.drug2} onChange={(e) => set("drug2", e.target.value)} className="rounded-xl bg-white" />
          </Field>
          <Field label="Drug 2 timing">
            <Select value={form.drug2Timing} onValueChange={(v) => onChange({ drug2Timing: v as ShapeFormState["drug2Timing"] })}>
              <SelectTrigger className="w-full rounded-xl"><SelectValue placeholder="Timing" /></SelectTrigger>
              <SelectContent className="z-(--z-popover)">
                <SelectItem value="day">☀️ Day</SelectItem>
                <SelectItem value="night">🌙 Night</SelectItem>
                <SelectItem value="both">☀️🌙 Both</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </>
      )}

      {isSchemaShape(shapeType) && (
        <>
          <Field label="Schema header">
            <Input value={form.schemaHeader} onChange={(e) => set("schemaHeader", e.target.value)} className="rounded-xl bg-white" />
          </Field>
          <Field label="Footer badge">
            <Input value={form.schemaFooterBadge} onChange={(e) => set("schemaFooterBadge", e.target.value)} className="rounded-xl bg-white" />
          </Field>
          <Field label="Theme">
            <Select value={form.schemaTheme} onValueChange={(v) => onChange({ schemaTheme: v as "dark" | "light" })}>
              <SelectTrigger className="w-full rounded-xl"><SelectValue placeholder="Theme" /></SelectTrigger>
              <SelectContent className="z-(--z-popover)">
                <SelectItem value="dark">Dark card</SelectItem>
                <SelectItem value="light">Light card</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </>
      )}
    </div>
  );
}
