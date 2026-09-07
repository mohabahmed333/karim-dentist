export type FilterLayout = {
  order: string[];
  enabled: Record<string, boolean>;
};

export function defaultFilterLayout(availableIds: string[]): FilterLayout {
  return {
    order: [...availableIds],
    enabled: Object.fromEntries(availableIds.map((id) => [id, true])),
  };
}

export function resolveFieldOrder(
  availableIds: string[],
  layout: FilterLayout | null,
): string[] {
  const available = new Set(availableIds);
  const stored = (layout?.order ?? []).filter((id) => available.has(id));
  const extras = availableIds.filter((id) => !stored.includes(id));
  return [...stored, ...extras];
}

export function resolveVisibleFieldIds(
  availableIds: string[],
  layout: FilterLayout | null,
): string[] {
  return resolveFieldOrder(availableIds, layout).filter(
    (id) => layout?.enabled[id] !== false,
  );
}

export function toggleFieldEnabled(
  layout: FilterLayout,
  id: string,
): FilterLayout {
  return {
    ...layout,
    enabled: { ...layout.enabled, [id]: layout.enabled[id] === false },
  };
}

export function moveField(
  order: string[],
  from: number,
  to: number,
): string[] {
  if (from < 0 || to < 0 || from >= order.length || to >= order.length) {
    return order;
  }
  const next = [...order];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function parseFilterLayout(raw: string | null): FilterLayout | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const record = parsed as Partial<FilterLayout>;
    if (!Array.isArray(record.order) || typeof record.enabled !== "object") {
      return null;
    }
    return {
      order: record.order.filter((id): id is string => typeof id === "string"),
      enabled: { ...record.enabled },
    };
  } catch {
    return null;
  }
}
