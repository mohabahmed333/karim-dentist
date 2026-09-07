import type { SectionContent } from "@/services/case_study_sections";

/** Shallow-merge section content; merge column slots by index when patched sparsely. */
export function mergeSectionContent(
  current: SectionContent,
  patch: Partial<SectionContent> & Record<string, unknown>,
): SectionContent {
  const cur = current as Record<string, unknown>;
  const next: Record<string, unknown> = { ...cur, ...patch };

  if (patch.slots != null && Array.isArray(cur.slots)) {
    const slotPatch = patch.slots;
    if (Array.isArray(slotPatch)) {
      next.slots = cur.slots.map((slot, i) => {
        const p = slotPatch[i];
        if (!p || typeof p !== "object") return slot;
        return { ...(slot as object), ...p };
      });
    } else if (typeof slotPatch === "object") {
      next.slots = cur.slots.map((slot, i) => {
        const p = (slotPatch as Record<string, unknown>)[String(i)] ??
          (slotPatch as Record<string, unknown>)[i];
        if (!p || typeof p !== "object") return slot;
        return { ...(slot as object), ...p };
      });
    }
  }

  return next as SectionContent;
}
