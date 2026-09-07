import type { PageSection } from "./pageSection";
import { CaseStudyPageHeading } from "./CaseStudyPageHeading";
import { CaseStudySectionList } from "./CaseStudySectionList";

type Props = {
  sections: PageSection[];
  previewMode?: boolean;
  customizeItemId?: string;
  customizeSection?: "case-studies" | "featured";
  fallbackTitle?: string | null;
  fallbackTitleAr?: string | null;
  fallbackDescription?: string | null;
  fallbackDescriptionAr?: string | null;
};

export function CaseStudyPageView({
  sections,
  previewMode,
  customizeItemId,
  customizeSection = "case-studies",
  fallbackTitle,
  fallbackTitleAr,
  fallbackDescription,
  fallbackDescriptionAr,
}: Props) {
  const hasTitle = sections.some(
    (section) => section.is_visible && section.type === "title",
  );

  return (
    <div className="cs-page dental-article">
      {!hasTitle && fallbackTitle ? (
        <CaseStudyPageHeading
          title={fallbackTitle}
          titleAr={fallbackTitleAr}
          description={fallbackDescription}
          descriptionAr={fallbackDescriptionAr}
        />
      ) : null}
      <CaseStudySectionList
        sections={sections}
        previewMode={previewMode}
        customizeItemId={customizeItemId}
        customizeSection={customizeSection}
      />
    </div>
  );
}
