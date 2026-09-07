import { upsertAbout } from "@/services/about";
import { updateCallout } from "@/services/callouts";
import {
  createCaseStudy,
  softDeleteCaseStudy,
  updateCaseStudy,
} from "@/services/case_studies";
import {
  createClientRow,
  softDeleteClient,
  updateClient,
} from "@/services/clients";
import {
  createExperience,
  softDeleteExperience,
  updateExperience,
} from "@/services/experience_entries";
import {
  createFeatured,
  softDeleteFeatured,
  updateFeatured,
} from "@/services/featured_projects";
import {
  createFooterLink,
  softDeleteFooterLink,
  updateFooterLink,
} from "@/services/footer_links";
import { updateHero } from "@/services/hero";
import type { PortfolioData } from "@/services/portfolio";
import { isReservedFooterLink } from "@/features/portfolio/lib/footerLinkHref";
import {
  createService,
  softDeleteService,
  updateService,
} from "@/services/services";
import { upsertSettings } from "@/services/site_settings";
import {
  createSocialLink,
  softDeleteSocialLink,
  updateSocialLink,
} from "@/services/social_links";
import type { CollectionSection } from "../types";

export async function persistSingleton(
  key: "hero" | "about" | "callout" | "settings",
  data: PortfolioData,
): Promise<void> {
  if (key === "hero" && data.hero) await updateHero(data.hero.id, data.hero);
  if (key === "about") await upsertAbout(data.about, data.about ?? {});
  if (key === "callout" && data.callout) {
    await updateCallout(data.callout.id, {
      body: data.callout.body,
      body_ar: data.callout.body_ar ?? "",
      lead_image_url: data.callout.lead_image_url ?? null,
    });
  }
  if (key === "settings") {
    await upsertSettings(data.settings, data.settings ?? {});
  }
}

export async function persistCollectionItem(
  section: CollectionSection,
  id: string,
  data: PortfolioData,
): Promise<void> {
  if (section === "case-studies") {
    const row = data.caseStudies.find((i) => i.id === id);
    if (row) await updateCaseStudy(id, row);
  } else if (section === "slider") {
    const row = data.featured.find((i) => i.id === id);
    if (row) await updateFeatured(id, row);
  } else if (section === "services") {
    const row = data.services.find((i) => i.id === id);
    if (row) await updateService(id, row);
  } else if (section === "footer") {
    const link = data.footerLinks.find((i) => i.id === id);
    if (link && !isReservedFooterLink(link)) await updateFooterLink(id, link);
    const social = data.socialLinks.find((i) => i.id === id);
    if (social) await updateSocialLink(id, social);
  }
}

export {
  createCaseStudy,
  softDeleteCaseStudy,
  createFeatured,
  softDeleteFeatured,
  createService,
  softDeleteService,
  createExperience,
  softDeleteExperience,
  createClientRow,
  softDeleteClient,
  createFooterLink,
  softDeleteFooterLink,
  createSocialLink,
  softDeleteSocialLink,
};
