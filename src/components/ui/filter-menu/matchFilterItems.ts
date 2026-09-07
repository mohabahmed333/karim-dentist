export type SearchableFilterItem = {
  id: string;
  label: string;
  keywords: string[];
};

function haystack(item: SearchableFilterItem): string {
  return [item.label, ...item.keywords].join("\n").toLowerCase();
}

export function matchFilterItems(
  items: SearchableFilterItem[],
  query: string,
): SearchableFilterItem[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return items;
  return items.filter((item) => haystack(item).includes(needle));
}
