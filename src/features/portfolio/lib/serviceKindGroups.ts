import type { Tables } from "@/lib/supabase/database.types";

export type ServiceKind = "our_services" | "laser";

export type ServiceKindGroupMeta = {
  kind: ServiceKind;
  title: string;
};

export type ServiceKindTitles = Partial<Record<ServiceKind, string>>;

export const SERVICE_KIND_GROUPS: ServiceKindGroupMeta[] = [
  { kind: "our_services", title: "Our Services" },
  { kind: "laser", title: "Laser treatments" },
];

const PLACEHOLDER_TITLES = new Set(["untitled", "بدون عنوان"]);

export function resolveServiceKindTitle(
  kind: ServiceKind,
  titles?: ServiceKindTitles,
) {
  return titles?.[kind] ?? SERVICE_KIND_GROUPS.find((g) => g.kind === kind)!.title;
}

export function hasVisibleServiceTitle(title: string | null | undefined) {
  const trimmed = (title ?? "").trim();
  if (!trimmed) return false;
  return !PLACEHOLDER_TITLES.has(trimmed.toLowerCase());
}

export function isLaserService(item: { kind?: unknown }) {
  return item.kind === "laser";
}

export function matchesServiceKind(
  item: { kind?: unknown },
  kind: ServiceKind,
) {
  return kind === "laser" ? isLaserService(item) : !isLaserService(item);
}

/** Always two groups (Our Services + Laser), each sorted by sort_order. */
export function groupServicesByKind<
  T extends { kind?: unknown; sort_order: number },
>(
  services: T[],
  titles?: ServiceKindTitles,
): Array<ServiceKindGroupMeta & { items: T[] }> {
  return SERVICE_KIND_GROUPS.map((group) => ({
    kind: group.kind,
    title: resolveServiceKindTitle(group.kind, titles),
    items: services
      .filter((item) => matchesServiceKind(item, group.kind))
      .sort((a, b) => a.sort_order - b.sort_order),
  }));
}

export type ServiceCard = Tables<"services">;
