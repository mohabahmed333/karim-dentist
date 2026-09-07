import type { PortfolioData } from "@/services/portfolio";
import type { FooterColumnKey } from "@/services/footer_links/types";
import type { CollectionSection } from "../types";
import {
  reorderFooterColumnToIndex,
  reorderList,
  reorderListToIndex,
} from "./dataHelpers";

function enqueueSectionRows(
  data: PortfolioData,
  section: CollectionSection,
  enqueue: (key: string) => void,
) {
  const key =
    section === "case-studies"
      ? "caseStudies"
      : section === "slider"
        ? "featured"
        : section === "services"
          ? "services"
          : "footerLinks";
  for (const row of data[key]) enqueue(`${section}:${row.id}`);
}

export function applyReorder(
  data: PortfolioData,
  section: CollectionSection,
  id: string,
  direction: "up" | "down",
  enqueue: (key: string) => void,
): PortfolioData {
  const next = reorderList(data, section, id, direction);
  enqueueSectionRows(next, section, enqueue);
  return next;
}

export function applyReorderToIndex(
  data: PortfolioData,
  section: CollectionSection,
  fromIndex: number,
  toIndex: number,
  enqueue: (key: string) => void,
): PortfolioData {
  const next = reorderListToIndex(data, section, fromIndex, toIndex);
  enqueueSectionRows(next, section, enqueue);
  return next;
}

export function applyFooterColumnReorderToIndex(
  data: PortfolioData,
  columnKey: FooterColumnKey,
  fromIndex: number,
  toIndex: number,
  enqueue: (key: string) => void,
): PortfolioData {
  const next = reorderFooterColumnToIndex(data, columnKey, fromIndex, toIndex);
  enqueueSectionRows(next, "footer", enqueue);
  return next;
}
