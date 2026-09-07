import type { SectionType } from "@/services/case_study_sections";

/** Flat bilingual text pairs inside builder section JSON (`enKey` / `arKey`). */
export type SectionTextPair = {
  path: string;
  enKey: string;
  arKey: string;
  en: string;
  ar: string;
  /** When set, pair lives on `content.slots[slotIndex]`. */
  slotIndex?: number;
};

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Collect EN/AR text pairs from parsed section content for translate jobs. */
export function collectSectionTextPairs(
  type: SectionType,
  content: Record<string, unknown>,
): SectionTextPair[] {
  const pairs: SectionTextPair[] = [];

  const add = (path: string, enKey: string, arKey: string) => {
    pairs.push({
      path,
      enKey,
      arKey,
      en: str(content[enKey]),
      ar: str(content[arKey]),
    });
  };

  switch (type) {
    case "title":
      add("title", "title", "title_ar");
      add("eyebrow", "eyebrow", "eyebrow_ar");
      break;
    case "intro":
      add("label", "label", "label_ar");
      add("body", "body", "body_ar");
      break;
    case "text":
    case "split":
    case "text_grid":
      add("heading", "heading", "heading_ar");
      add("body", "body", "body_ar");
      break;
    case "media":
      add("caption", "caption", "caption_ar");
      break;
    case "columns": {
      const slots = Array.isArray(content.slots) ? content.slots : [];
      slots.forEach((raw, slotIndex) => {
        if (!raw || typeof raw !== "object") return;
        const slot = raw as Record<string, unknown>;
        if (slot.kind !== "text") return;
        pairs.push({
          path: `slot.${slotIndex}.heading`,
          enKey: "heading",
          arKey: "heading_ar",
          en: str(slot.heading),
          ar: str(slot.heading_ar),
          slotIndex,
        });
        pairs.push({
          path: `slot.${slotIndex}.body`,
          enKey: "body",
          arKey: "body_ar",
          en: str(slot.body),
          ar: str(slot.body_ar),
          slotIndex,
        });
      });
      break;
    }
    default:
      break;
  }

  return pairs;
}

/** Patch one bilingual field on section content (supports column slots). */
export function contentPatchForPair(
  pair: SectionTextPair,
  field: "en" | "ar",
  value: string,
): Record<string, unknown> {
  const key = field === "en" ? pair.enKey : pair.arKey;
  if (pair.slotIndex === undefined) {
    return { [key]: value };
  }
  // Sparse slot patch — sectionHelpers merges per-index into current slots.
  return {
    slots: {
      [pair.slotIndex]: { [key]: value },
    },
  };
}
