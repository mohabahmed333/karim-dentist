import type { PortfolioData } from "@/services/portfolio";
import type { CollectionSection } from "../types";

type ListItem = { id: string; sort_order: number } & Record<string, unknown>;

export function collectionItems(
  data: PortfolioData,
  section: CollectionSection,
): ListItem[] {
  if (section === "case-studies") return data.caseStudies;
  if (section === "slider") return data.featured;
  if (section === "services") return data.services;
  return data.footerLinks
    .filter((link) => link.column_key !== "resources")
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function itemLabel(item: ListItem): string {
  if (typeof item.title === "string" && item.title) return item.title;
  if (typeof item.name === "string" && item.name) return item.name;
  if (typeof item.label === "string" && item.label) return item.label;
  if (typeof item.platform === "string" && item.platform) return item.platform;
  return item.id.slice(0, 8);
}
