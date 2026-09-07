import type { Tables } from "@/lib/supabase/database.types";
import type { PortfolioData } from "@/services/portfolio";
import type { FooterColumnKey } from "@/services/footer_links/types";

export const FOOTER_COLUMNS = [
  { key: "portfolio" as const, title: "Links" },
  { key: "follow" as const, title: "Follow Us" },
] satisfies ReadonlyArray<{ key: FooterColumnKey; title: string }>;

export function footerLinksForColumn(
  data: PortfolioData,
  columnKey: FooterColumnKey,
) {
  return data.footerLinks
    .filter((link) => link.column_key === columnKey)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function footerLinkLabel(link: Tables<"footer_links">) {
  if (link.display_mode === "icon") {
    return `${link.label} (icon)`;
  }
  return link.label;
}
