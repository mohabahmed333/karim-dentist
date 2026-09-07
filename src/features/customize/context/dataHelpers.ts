import type { PortfolioData } from "@/services/portfolio";
import { isReservedFooterLink } from "@/features/portfolio/lib/footerLinkHref";
import type { FooterColumnKey } from "@/services/footer_links/types";
import { withEnsuredSlug } from "@/services/case_studies/slug";
import { moveListToIndex } from "../lib/moveListToIndex";
import type { CollectionSection } from "../types";

export function cloneData(data: PortfolioData): PortfolioData {
  return structuredClone(data);
}

export function listKey(
  section: CollectionSection,
): keyof Pick<
  PortfolioData,
  | "caseStudies"
  | "featured"
  | "services"
  | "footerLinks"
  | "socialLinks"
> {
  if (section === "case-studies") return "caseStudies";
  if (section === "slider") return "featured";
  if (section === "services") return "services";
  return "footerLinks";
}

export function patchListItem(
  data: PortfolioData,
  section: CollectionSection,
  id: string,
  partial: Record<string, unknown>,
): PortfolioData {
  if (section === "footer") {
    const inLinks = data.footerLinks.some((i) => i.id === id);
    if (inLinks) {
      const current = data.footerLinks.find((i) => i.id === id);
      if (current && isReservedFooterLink(current)) {
        const labelPatch: Record<string, unknown> = {};
        if ("label" in partial) labelPatch.label = partial.label;
        if ("label_ar" in partial) labelPatch.label_ar = partial.label_ar;
        if (Object.keys(labelPatch).length === 0) return data;
        return {
          ...data,
          footerLinks: data.footerLinks.map((i) =>
            i.id === id ? { ...i, ...labelPatch } : i,
          ),
        };
      }
      return {
        ...data,
        footerLinks: data.footerLinks.map((i) =>
          i.id === id ? { ...i, ...partial } : i,
        ),
      };
    }
    return {
      ...data,
      socialLinks: data.socialLinks.map((i) =>
        i.id === id ? { ...i, ...partial } : i,
      ),
    };
  }
  const key = listKey(section);
  const list = data[key] as Array<{
    id: string;
    slug?: string | null;
    title?: string;
  }>;
  const current = list.find((i) => i.id === id);
  const nextPartial =
    current && (section === "case-studies" || section === "slider")
      ? withEnsuredSlug(current, partial)
      : partial;
  return {
    ...data,
    [key]: list.map((i) => (i.id === id ? { ...i, ...nextPartial } : i)),
  };
}

type SortableRow = { id: string; sort_order: number };

function withReindexedOrders<T extends SortableRow>(list: T[]): T[] {
  return list.map((row, index) => ({ ...row, sort_order: index + 1 }));
}

export function reorderList(
  data: PortfolioData,
  section: CollectionSection,
  id: string,
  direction: "up" | "down",
): PortfolioData {
  if (section === "footer") {
    const link = data.footerLinks.find((i) => i.id === id);
    if (!link || isReservedFooterLink(link)) return data;
    const list = data.footerLinks
      .filter((i) => i.column_key === link.column_key)
      .sort((a, b) => a.sort_order - b.sort_order);
    const index = list.findIndex((i) => i.id === id);
    if (index < 0) return data;
    const swap = direction === "up" ? index - 1 : index + 1;
    if (swap < 0 || swap >= list.length) return data;
    return reorderFooterColumnToIndex(data, link.column_key, index, swap);
  }

  const key = listKey(section);
  const list = [...(data[key] as SortableRow[])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const index = list.findIndex((i) => i.id === id);
  if (index < 0) return data;
  const swap = direction === "up" ? index - 1 : index + 1;
  if (swap < 0 || swap >= list.length) return data;
  return reorderListToIndex(data, section, index, swap);
}

export function reorderListToIndex(
  data: PortfolioData,
  section: CollectionSection,
  fromIndex: number,
  toIndex: number,
): PortfolioData {
  if (section === "footer") return data;

  const key = listKey(section);
  const list = [...(data[key] as SortableRow[])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const moved = moveListToIndex(list, fromIndex, toIndex);
  if (moved === list) return data;
  return { ...data, [key]: withReindexedOrders(moved) };
}

export function reorderFooterColumnToIndex(
  data: PortfolioData,
  columnKey: FooterColumnKey,
  fromIndex: number,
  toIndex: number,
): PortfolioData {
  const column = data.footerLinks
    .filter((i) => i.column_key === columnKey)
    .sort((a, b) => a.sort_order - b.sort_order);
  const from = column[fromIndex];
  if (!from || isReservedFooterLink(from)) return data;
  const moved = moveListToIndex(column, fromIndex, toIndex);
  if (moved === column) return data;
  const other = data.footerLinks.filter((i) => i.column_key !== columnKey);
  return {
    ...data,
    footerLinks: [...other, ...withReindexedOrders(moved)],
  };
}
