export function parseServiceFilter(raw: string | null | undefined): string[] {
  if (!raw || raw === "all") return [];
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export function serializeServiceFilter(ids: string[]): string {
  return ids.length === 0 ? "all" : ids.join(",");
}

export function toggleServiceId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}
