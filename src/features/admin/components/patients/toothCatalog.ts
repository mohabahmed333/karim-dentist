import { FDI_NUMBERS, toothName } from "@/services/patient_tooth_findings/fdi";

export type ToothOption = {
  fdi: string;
  name: string;
  label: string;
};

export const TOOTH_OPTIONS: ToothOption[] = FDI_NUMBERS.map((fdi) => {
  const name = toothName(fdi);
  return { fdi, name, label: `${fdi} · ${name}` };
});

export function toothOptionByFdi(fdi: string | null | undefined): ToothOption | null {
  if (!fdi) return null;
  return TOOTH_OPTIONS.find((t) => t.fdi === fdi) ?? null;
}

export function filterToothOptions(query: string): ToothOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return TOOTH_OPTIONS;
  return TOOTH_OPTIONS.filter(
    (t) =>
      t.fdi.includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.label.toLowerCase().includes(q),
  );
}
