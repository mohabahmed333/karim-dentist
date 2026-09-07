"use client";

import { createContext, useContext } from "react";
import type { PortfolioData } from "@/services/portfolio";
import type {
  ParsedCaseStudySection,
  SectionContent,
  SectionType,
} from "@/services/case_study_sections";
import type { FooterColumnKey } from "@/services/footer_links/types";
import type {
  GalleryComparison,
  GalleryItem,
  GalleryShowcase,
  SolutionPanel,
  TrustItem,
} from "@/services/dental/types";
import type { CollectionSection, SaveStatus } from "../types";

export type CustomizeActions = {
  patchHero: (partial: Partial<NonNullable<PortfolioData["hero"]>>) => void;
  patchAbout: (partial: Partial<NonNullable<PortfolioData["about"]>>) => void;
  patchCallout: (
    partial: Partial<NonNullable<PortfolioData["callout"]>>,
  ) => void;
  patchSettings: (
    partial: Partial<NonNullable<PortfolioData["settings"]>>,
  ) => void;
  patchTrustItem: (id: string, partial: Partial<TrustItem>) => void;
  patchSolutionPanel: (id: string, partial: Partial<SolutionPanel>) => void;
  patchGalleryItem: (id: string, partial: Partial<GalleryItem>) => void;
  patchGalleryShowcase: (partial: Partial<GalleryShowcase>) => void;
  patchGalleryComparison: (
    id: string,
    partial: Partial<GalleryComparison>,
  ) => void;
  addGalleryComparison: () => Promise<string | null>;
  removeGalleryComparison: (id: string) => Promise<void>;
  reorderGalleryComparison: (id: string, direction: "up" | "down") => void;
  reorderGalleryComparisonToIndex: (
    fromIndex: number,
    toIndex: number,
  ) => void;
  patchCollectionItem: (
    section: CollectionSection,
    id: string,
    partial: Record<string, unknown>,
  ) => void;
  reorderCollection: (
    section: CollectionSection,
    id: string,
    direction: "up" | "down",
  ) => void;
  reorderCollectionToIndex: (
    section: CollectionSection,
    fromIndex: number,
    toIndex: number,
  ) => void;
  reorderFooterColumnToIndex: (
    columnKey: FooterColumnKey,
    fromIndex: number,
    toIndex: number,
  ) => void;
  addCollectionItem: (section: CollectionSection) => Promise<string | null>;
  addFooterLink: (columnKey: FooterColumnKey) => Promise<string | null>;
  removeCollectionItem: (
    section: CollectionSection,
    id: string,
  ) => Promise<void>;
  patchCaseStudySection: (
    caseStudyId: string,
    sectionId: string,
    partial: Partial<ParsedCaseStudySection> & { content?: SectionContent },
  ) => void;
  reorderCaseStudySection: (
    caseStudyId: string,
    sectionId: string,
    direction: "up" | "down",
  ) => void;
  reorderCaseStudySectionToIndex: (
    caseStudyId: string,
    fromIndex: number,
    toIndex: number,
  ) => void;
  addCaseStudySection: (
    caseStudyId: string,
    type: SectionType,
    options?: {
      layoutVariant?: string;
      content?: SectionContent;
    },
  ) => Promise<string | null>;
  duplicateCaseStudySection: (
    caseStudyId: string,
    sectionId: string,
  ) => Promise<string | null>;
  removeCaseStudySection: (
    caseStudyId: string,
    sectionId: string,
  ) => Promise<void>;
  patchFeaturedSection: (
    featuredProjectId: string,
    sectionId: string,
    partial: Partial<ParsedCaseStudySection> & { content?: SectionContent },
  ) => void;
  reorderFeaturedSection: (
    featuredProjectId: string,
    sectionId: string,
    direction: "up" | "down",
  ) => void;
  reorderFeaturedSectionToIndex: (
    featuredProjectId: string,
    fromIndex: number,
    toIndex: number,
  ) => void;
  addFeaturedSection: (
    featuredProjectId: string,
    type: SectionType,
    options?: {
      layoutVariant?: string;
      content?: SectionContent;
    },
  ) => Promise<string | null>;
  duplicateFeaturedSection: (
    featuredProjectId: string,
    sectionId: string,
  ) => Promise<string | null>;
  removeFeaturedSection: (
    featuredProjectId: string,
    sectionId: string,
  ) => Promise<void>;
  saveNow: () => Promise<boolean>;
  discard: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
};

export type CustomizeContextValue = CustomizeActions & {
  data: PortfolioData;
  status: SaveStatus;
};

export const CustomizeDataContext = createContext<PortfolioData | null>(null);
export const CustomizeStatusContext = createContext<SaveStatus | null>(null);
export const CustomizeActionsContext = createContext<CustomizeActions | null>(
  null,
);

export function useCustomizeData(): PortfolioData {
  const data = useContext(CustomizeDataContext);
  if (!data) {
    throw new Error("useCustomizeData must be used within CustomizeProvider");
  }
  return data;
}

export function useCustomizeStatus(): SaveStatus {
  const status = useContext(CustomizeStatusContext);
  if (!status) {
    throw new Error("useCustomizeStatus must be used within CustomizeProvider");
  }
  return status;
}

export function useCustomizeActions(): CustomizeActions {
  const actions = useContext(CustomizeActionsContext);
  if (!actions) {
    throw new Error("useCustomizeActions must be used within CustomizeProvider");
  }
  return actions;
}

export function useCustomize(): CustomizeContextValue {
  return {
    data: useCustomizeData(),
    status: useCustomizeStatus(),
    ...useCustomizeActions(),
  };
}
