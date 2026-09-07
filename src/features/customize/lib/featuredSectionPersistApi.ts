import type { PortfolioData } from "@/services/portfolio";
import type { ParsedFeaturedSection } from "@/services/featured_project_sections";
import type { SectionContent, SectionType } from "@/services/case_study_sections";
import {
  createFeaturedSectionOfType,
  duplicateFeaturedSection,
  reorderFeaturedSections,
  softDeleteFeaturedSection,
  updateFeaturedSection,
} from "@/services/featured_project_sections/mutations";

export function getFeaturedSections(
  data: PortfolioData,
  featuredProjectId: string,
): ParsedFeaturedSection[] {
  return data.featuredProjectSections[featuredProjectId] ?? [];
}

export async function persistFeaturedSection(
  featuredProjectId: string,
  sectionId: string,
  data: PortfolioData,
): Promise<void> {
  const section = getFeaturedSections(data, featuredProjectId).find(
    (item) => item.id === sectionId,
  );
  if (!section) return;
  await updateFeaturedSection(sectionId, {
    type: section.type,
    layout_variant: section.layout_variant,
    content: section.content,
    sort_order: section.sort_order,
    is_visible: section.is_visible,
  });
}

export async function persistFeaturedSectionOrder(
  featuredProjectId: string,
  data: PortfolioData,
): Promise<void> {
  const sections = getFeaturedSections(data, featuredProjectId);
  await reorderFeaturedSections(
    featuredProjectId,
    sections.map((section) => section.id),
  );
}

export async function createFeaturedPageSection(
  featuredProjectId: string,
  type: SectionType,
  sortOrder: number,
  options?: {
    layoutVariant?: string;
    content?: SectionContent;
  },
) {
  return createFeaturedSectionOfType(featuredProjectId, type, sortOrder, options);
}

export { duplicateFeaturedSection, softDeleteFeaturedSection };
