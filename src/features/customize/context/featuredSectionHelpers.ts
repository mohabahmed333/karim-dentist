import type { PortfolioData } from "@/services/portfolio";
import type { ParsedFeaturedSection } from "@/services/featured_project_sections";
import type { SectionContent } from "@/services/case_study_sections";
import { moveListToIndex } from "../lib/moveListToIndex";
import { mergeSectionContent } from "../lib/mergeSectionContent";

export function patchFeaturedSection(
  data: PortfolioData,
  featuredProjectId: string,
  sectionId: string,
  partial: Partial<ParsedFeaturedSection> & { content?: SectionContent },
): PortfolioData {
  const sections = data.featuredProjectSections[featuredProjectId] ?? [];
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
    featuredProjectSections: {
      ...data.featuredProjectSections,
      [featuredProjectId]: nextSections,
    },
  };
}

export function reorderFeaturedSections(
  data: PortfolioData,
  featuredProjectId: string,
  sectionId: string,
  direction: "up" | "down",
): PortfolioData {
  const sections = [
    ...(data.featuredProjectSections[featuredProjectId] ?? []),
  ].sort((a, b) => a.sort_order - b.sort_order);
  const index = sections.findIndex((section) => section.id === sectionId);
  if (index < 0) return data;
  const swap = direction === "up" ? index - 1 : index + 1;
  if (swap < 0 || swap >= sections.length) return data;
  return reorderFeaturedSectionsToIndex(
    data,
    featuredProjectId,
    index,
    swap,
  );
}

export function reorderFeaturedSectionsToIndex(
  data: PortfolioData,
  featuredProjectId: string,
  fromIndex: number,
  toIndex: number,
): PortfolioData {
  const sections = [
    ...(data.featuredProjectSections[featuredProjectId] ?? []),
  ].sort((a, b) => a.sort_order - b.sort_order);
  const moved = moveListToIndex(sections, fromIndex, toIndex);
  if (moved === sections) return data;
  return {
    ...data,
    featuredProjectSections: {
      ...data.featuredProjectSections,
      [featuredProjectId]: moved.map((section, index) => ({
        ...section,
        sort_order: index + 1,
      })),
    },
  };
}

export function insertFeaturedSection(
  data: PortfolioData,
  featuredProjectId: string,
  section: ParsedFeaturedSection,
): PortfolioData {
  const sections = [
    ...(data.featuredProjectSections[featuredProjectId] ?? []),
    section,
  ];
  sections.sort((a, b) => a.sort_order - b.sort_order);
  return {
    ...data,
    featuredProjectSections: {
      ...data.featuredProjectSections,
      [featuredProjectId]: sections,
    },
  };
}

export function removeFeaturedSection(
  data: PortfolioData,
  featuredProjectId: string,
  sectionId: string,
): PortfolioData {
  const sections = (data.featuredProjectSections[featuredProjectId] ?? []).filter(
    (section) => section.id !== sectionId,
  );
  return {
    ...data,
    featuredProjectSections: {
      ...data.featuredProjectSections,
      [featuredProjectId]: sections,
    },
  };
}

export function replaceFeaturedSectionId(
  data: PortfolioData,
  featuredProjectId: string,
  tempId: string,
  nextSection: ParsedFeaturedSection,
): PortfolioData {
  const sections = (data.featuredProjectSections[featuredProjectId] ?? []).map(
    (section) => (section.id === tempId ? nextSection : section),
  );
  return {
    ...data,
    featuredProjectSections: {
      ...data.featuredProjectSections,
      [featuredProjectId]: sections,
    },
  };
}

export function nextFeaturedSectionSortOrder(
  data: PortfolioData,
  featuredProjectId: string,
): number {
  const sections = data.featuredProjectSections[featuredProjectId] ?? [];
  if (sections.length === 0) return 0;
  return Math.max(...sections.map((section) => section.sort_order)) + 1;
}
