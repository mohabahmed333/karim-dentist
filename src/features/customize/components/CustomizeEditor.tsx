"use client";

import { parseSectionBlockIdFromField } from "../lib/sectionField";
import {
  isGalleryComparisonId,
  isGalleryItemId,
  isSolutionPanelId,
  isTrustItemId,
} from "../lib/dentalCustomize";
import { useCustomizeData } from "../context/CustomizeContext";
import {
  isCollectionSection,
  type CustomizeSection,
} from "../types";
import { AboutPanel } from "./AboutPanel";
import { CaseStudyPageBuilderPanel } from "./CaseStudyPageBuilderPanel";
import { CollectionItemPanel } from "./CollectionItemPanel";
import { ContactPanel } from "./ContactPanel";
import { FooterPanel } from "./FooterPanel";
import { GalleryComparisonItemPanel } from "./GalleryComparisonItemPanel";
import { GalleryPanel } from "./GalleryPanel";
import { HeroPanel } from "./HeroPanel";
import { ServicesSectionPanel } from "./ServicesSectionPanel";
import { SettingsPanel } from "./SettingsPanel";
import { SliderPanel } from "./SliderPanel";

type Props = {
  section: CustomizeSection;
  itemId?: string;
  focusField?: string | null;
  builderMode?: boolean;
};

export function CustomizeEditor({
  section,
  itemId,
  focusField,
  builderMode,
}: Props) {
  const data = useCustomizeData();

  if (builderMode && section === "case-studies" && itemId) {
    const selectedSectionId = parseSectionBlockIdFromField(focusField);
    return (
      <CaseStudyPageBuilderPanel
        caseStudyId={itemId}
        selectedSectionId={selectedSectionId}
      />
    );
  }

  if (section === "gallery" && itemId && isGalleryComparisonId(data, itemId)) {
    return (
      <GalleryComparisonItemPanel id={itemId} focusField={focusField} />
    );
  }

  if (section === "gallery" && itemId && isGalleryItemId(data, itemId)) {
    return (
      <GalleryPanel focusField={focusField} />
    );
  }

  if (section === "about" && itemId && isTrustItemId(data, itemId)) {
    return (
      <AboutPanel focusTrustId={itemId} focusField={focusField} />
    );
  }

  if (section === "services" && itemId && isSolutionPanelId(data, itemId)) {
    return (
      <ServicesSectionPanel
        focusPanelId={itemId}
        focusField={focusField}
      />
    );
  }

  if (isCollectionSection(section)) {
    if (itemId) {
      return (
        <CollectionItemPanel
          section={section}
          id={itemId}
          focusField={focusField}
        />
      );
    }
    if (section === "footer") return <FooterPanel focusField={focusField} />;
    if (section === "services") {
      return <ServicesSectionPanel focusField={focusField} />;
    }
    if (section === "slider") return <SliderPanel focusField={focusField} />;
    return null;
  }
  if (section === "hero") return <HeroPanel focusField={focusField} />;
  if (section === "about") return <AboutPanel focusField={focusField} />;
  if (section === "gallery") return <GalleryPanel focusField={focusField} />;
  if (section === "contact") return <ContactPanel focusField={focusField} />;
  return <SettingsPanel />;
}
