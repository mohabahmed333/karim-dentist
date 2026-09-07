export type ClinicalNoteCategory = "SOAP" | "Quick Note" | "Alert" | "Lab";

export type ClinicalNote = {
  id: string;
  targetId: string;
  category: ClinicalNoteCategory;
  content: string;
  createdAt: string;
  author: string;
};

export type NoteTarget = {
  id: string;
  label: string;
};

export const NOTE_CATEGORIES: readonly ClinicalNoteCategory[] = [
  "SOAP",
  "Quick Note",
  "Alert",
  "Lab",
];

export const NOTE_STAMPS = [
  "Cold Sensitive",
  "Deep Decay",
  "BOP Positive",
  "Patient Informed",
] as const;

export function noteHeaderLabel(target: NoteTarget | null): string {
  if (!target || target.id === "visit") return "General Visit Note";
  return `Note for ${target.label}`;
}

export function buildClinicalNote(input: {
  targetId: string;
  category: ClinicalNoteCategory;
  content: string;
  author?: string;
}): ClinicalNote {
  return {
    id: crypto.randomUUID(),
    targetId: input.targetId,
    category: input.category,
    content: input.content.trim(),
    createdAt: new Date().toISOString(),
    author: input.author ?? "Dentist",
  };
}
