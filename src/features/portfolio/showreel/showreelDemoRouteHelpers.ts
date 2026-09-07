/** Pure helpers for showreel customize routing (kept free of path aliases for node:test). */

export function resolveShowreelCaseStudyItemId(
  item: string | undefined,
  caseStudyIds: string[],
) {
  if (!item || caseStudyIds.length === 0) return null;
  if (item === "first") return caseStudyIds[0] ?? null;
  return caseStudyIds.includes(item) ? item : null;
}

export function resolveShowreelFocusField(focus: string | undefined) {
  return focus?.trim() ? focus : null;
}
