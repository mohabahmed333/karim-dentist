import type { CommandHit } from "./commandPalette";

const MAX_IDS = 12;

export function extractCommandSearchIds(raw: string): string[] {
  const fence = raw.match(/```json\s*([\s\S]*?)```/i);
  const blob = fence?.[1]?.trim() || raw.trim();
  try {
    const parsed = JSON.parse(blob) as { ids?: unknown };
    if (!Array.isArray(parsed.ids)) return [];
    return parsed.ids
      .filter((id): id is string => typeof id === "string" && id.length > 0)
      .slice(0, MAX_IDS);
  } catch {
    return [];
  }
}

export function mergeAiHitOrder(
  allHits: CommandHit[],
  local: CommandHit[],
  aiIds: string[],
): CommandHit[] {
  const byId = new Map(allHits.map((item) => [item.id, item]));
  const seen = new Set<string>();
  const out: CommandHit[] = [];
  for (const id of aiIds) {
    const item = byId.get(id);
    if (!item || seen.has(id)) continue;
    seen.add(id);
    out.push(item);
  }
  for (const item of local) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}
