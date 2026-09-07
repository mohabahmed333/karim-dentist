import type { PortfolioData } from "@/services/portfolio";
import type {
  ParsedCaseStudySection,
  SectionContent,
  SectionType,
} from "@/services/case_study_sections";
import { moveListToIndex } from "../lib/moveListToIndex";
import { mergeSectionContent } from "../lib/mergeSectionContent";

export function patchCaseStudySection(
  data: PortfolioData,
  caseStudyId: string,
  sectionId: string,
  partial: Partial<ParsedCaseStudySection> & { content?: SectionContent },
): PortfolioData {
  const sections = data.caseStudySections[caseStudyId] ?? [];
  const nextSections = sections.map((section) => {
    if (section.id !== sectionId) return section;
    const { content: nextContent, ...rest } = partial;
    return {
      ...section,
      ...rest,
      content: nextContent
        ? mergeSectionContent(section.content, nextContent)
        : section.content,
    };
  });
  return {
    ...data,
    caseStudySections: {
      ...data.caseStudySections,
      [caseStudyId]: nextSections,
    },
  };
}

export function reorderCaseStudySections(
  data: PortfolioData,
  caseStudyId: string,
  sectionId: string,
  direction: "up" | "down",
): PortfolioData {
  const sections = [...(data.caseStudySections[caseStudyId] ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const index = sections.findIndex((section) => section.id === sectionId);
  if (index < 0) return data;
  const swap = direction === "up" ? index - 1 : index + 1;
  if (swap < 0 || swap >= sections.length) return data;
  return reorderCaseStudySectionsToIndex(data, caseStudyId, index, swap);
}

export function reorderCaseStudySectionsToIndex(
  data: PortfolioData,
  caseStudyId: string,
  fromIndex: number,
  toIndex: number,
): PortfolioData {
  const sections = [...(data.caseStudySections[caseStudyId] ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const moved = moveListToIndex(sections, fromIndex, toIndex);
  if (moved === sections) return data;
  return {
    ...data,
    caseStudySections: {
      ...data.caseStudySections,
      [caseStudyId]: moved.map((section, index) => ({
        ...section,
        sort_order: index + 1,
      })),
    },
  };
}

export function insertCaseStudySection(
  data: PortfolioData,
  caseStudyId: string,
  section: ParsedCaseStudySection,
): PortfolioData {
  const sections = [...(data.caseStudySections[caseStudyId] ?? []), section];
  sections.sort((a, b) => a.sort_order - b.sort_order);
  return {
    ...data,
    caseStudySections: {
      ...data.caseStudySections,
      [caseStudyId]: sections,
    },
  };
}

export function removeCaseStudySection(
  data: PortfolioData,
  caseStudyId: string,
  sectionId: string,
): PortfolioData {
  const sections = (data.caseStudySections[caseStudyId] ?? []).filter(
    (section) => section.id !== sectionId,
  );
  return {
    ...data,
    caseStudySections: {
      ...data.caseStudySections,
      [caseStudyId]: sections,
    },
  };
}

export function replaceCaseStudySectionId(
  data: PortfolioData,
  caseStudyId: string,
  tempId: string,
  nextSection: ParsedCaseStudySection,
): PortfolioData {
  const sections = (data.caseStudySections[caseStudyId] ?? []).map((section) =>
    section.id === tempId ? nextSection : section,
  );
  return {
    ...data,
    caseStudySections: {
      ...data.caseStudySections,
      [caseStudyId]: sections,
    },
  };
}

export function nextSectionSortOrder(
  data: PortfolioData,
  caseStudyId: string,
): number {
  const sections = data.caseStudySections[caseStudyId] ?? [];
  if (sections.length === 0) return 0;
  return Math.max(...sections.map((section) => section.sort_order)) + 1;
}

export function parseSectionFromRow(
  row: ParsedCaseStudySection,
): ParsedCaseStudySection {
  return row;
}

export type { SectionType };
