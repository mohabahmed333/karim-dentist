import { textDirection } from "./chat/textDirection";
import type { SupportNote } from "./supportDummyData";

export function formatNoteTime(iso: string | undefined, locale: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(locale === "ar" ? "ar" : undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function noteBodyDir(body: string) {
  return textDirection(body);
}

export function sortNotes(notes: SupportNote[]): SupportNote[] {
  return [...notes].sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) {
      return a.pinned ? -1 : 1;
    }
    return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
  });
}
