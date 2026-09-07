import {
  createCaseStudy,
  createClientRow,
  createExperience,
  createFeatured,
  createFooterLink,
  createService,
  softDeleteCaseStudy,
  softDeleteClient,
  softDeleteExperience,
  softDeleteFeatured,
  softDeleteFooterLink,
  softDeleteService,
  softDeleteSocialLink,
} from "../lib/persistApi";
import type { FooterColumnKey } from "@/services/footer_links/types";
import type { CollectionSection } from "../types";
import {
  newCaseStudyDefaults,
  newFeaturedDefaults,
  newServiceDefaults,
} from "./collectionDefaults";

export async function createCollectionRow(
  section: CollectionSection,
  sort_order: number,
  footerColumn: FooterColumnKey = "portfolio",
) {
  if (section === "case-studies") {
    return createCaseStudy(newCaseStudyDefaults(sort_order));
  }
  if (section === "slider") {
    return createFeatured(newFeaturedDefaults(sort_order));
  }
  if (section === "services") {
    return createService(newServiceDefaults(sort_order));
  }
  return createFooterLink({
    label: footerColumn === "follow" ? "New social" : "New link",
    label_ar: "",
    href: footerColumn === "follow" ? "https://" : "#",
    column_key: footerColumn,
    display_mode: footerColumn === "follow" ? "icon" : "text",
    icon_key: footerColumn === "follow" ? "linkedin" : null,
    icon_url: null,
    sort_order,
  });
}

export async function deleteCollectionRow(
  section: CollectionSection,
  id: string,
  isSocial: boolean,
) {
  if (section === "case-studies") return softDeleteCaseStudy(id);
  if (section === "slider") return softDeleteFeatured(id);
  if (section === "services") return softDeleteService(id);
  if (isSocial) return softDeleteSocialLink(id);
  return softDeleteFooterLink(id);
}
