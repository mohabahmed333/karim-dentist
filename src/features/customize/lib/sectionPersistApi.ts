import type { PortfolioData } from "@/services/portfolio";
import type { ParsedCaseStudySection } from "@/services/case_study_sections";
import {
  createSectionOfType,
  duplicateSection,
  reorderSections,
  softDeleteSection,
  updateSection,
  type SectionType,
} from "@/services/case_study_sections";

export function getStudySections(
  data: PortfolioData,
  caseStudyId: string,
): ParsedCaseStudySection[] {
  return data.caseStudySections[caseStudyId] ?? [];
}

export async function persistCaseStudySection(
  caseStudyId: string,
  sectionId: string,
  data: PortfolioData,
): Promise<void> {
  const section = getStudySections(data, caseStudyId).find(
    (item) => item.id === sectionId,
  );
  if (!section) return;
  await updateSection(sectionId, {
    type: section.type,
    layout_variant: section.layout_variant,
    content: section.content,
    sort_order: section.sort_order,
    is_visible: section.is_visible,
  });
}

export async function persistCaseStudySectionOrder(
  caseStudyId: string,
  data: PortfolioData,
): Promise<void> {
  const sections = getStudySections(data, caseStudyId);
  await reorderSections(
    caseStudyId,
    sections.map((section) => section.id),
  );
}

export async function createCaseStudySection(
  caseStudyId: string,
  type: SectionType,
  sortOrder: number,
  options?: {
    layoutVariant?: string;
    content?: import("@/services/case_study_sections").SectionContent;
  },
) {
  return createSectionOfType(caseStudyId, type, sortOrder, options);
}

export { duplicateSection, softDeleteSection };
