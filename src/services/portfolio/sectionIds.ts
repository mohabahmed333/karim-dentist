type SectionRow = {
  case_study_id?: string;
  featured_project_id?: string;
};

export function groupSectionCounts(
  rows: SectionRow[],
  key: "case_study_id" | "featured_project_id",
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const id = row[key];
    if (!id) continue;
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}

export function detailPageIdsFromCounts(
  items: { id: string; slug: string | null }[],
  _counts: Record<string, number>,
): string[] {
  return items
    .filter((item) => Boolean(item.slug?.trim()))
    .map((item) => item.id);
}
