import type {
  ColumnsContent,
  GridContent,
  IntroContent,
  MediaContent,
  ParsedCaseStudySection,
  SplitContent,
  TextContent,
  TextGridContent,
  TitleContent,
} from "@/services/case_study_sections";
import type { PageSection } from "./pageSection";
import { CaseStudyColumnsBlock } from "./CaseStudyColumnsBlock";
import { CaseStudyGridBlock } from "./CaseStudyGridBlock";
import { CaseStudyIntroBlock } from "./CaseStudyIntroBlock";
import { CaseStudyMediaBlock } from "./CaseStudyMediaBlock";
import { CaseStudySplitBlock } from "./CaseStudySplitBlock";
import { CaseStudyTextBlock } from "./CaseStudyTextBlock";
import { CaseStudyTextGridBlock } from "./CaseStudyTextGridBlock";
import { CaseStudyTitleBlock } from "./CaseStudyTitleBlock";

type Props = {
  sections: PageSection[];
  previewMode?: boolean;
  customizeItemId?: string;
  customizeSection?: "case-studies" | "featured";
};

export function CaseStudySectionList({
  sections,
  previewMode,
  customizeItemId,
  customizeSection = "case-studies",
}: Props) {
  const visible = sections.filter((section) => section.is_visible);
  const firstTitleId = visible.find((section) => section.type === "title")?.id;

  return (
    <div className="cs-sections">
      {visible
        .map((section, index) => {
          const blockSection = section as ParsedCaseStudySection;
          return (
          <div
            key={section.id}
            id={`customize-section-${section.id}`}
            className="cs-section-wrap"
            data-customize-section-block={section.id}
            data-customize-section={customizeItemId ? customizeSection : undefined}
            data-customize-item={customizeItemId}
            data-customize-field={
              customizeItemId ? `section-${section.id}` : undefined
            }
            data-section-index={index}
          >
            {section.type === "title" ? (
              <CaseStudyTitleBlock
                section={blockSection}
                content={section.content as TitleContent}
                previewMode={previewMode}
                headingLevel={section.id === firstTitleId ? "h1" : "h2"}
              />
            ) : null}
            {section.type === "intro" ? (
              <CaseStudyIntroBlock
                section={blockSection}
                content={section.content as IntroContent}
                previewMode={previewMode}
              />
            ) : null}
            {section.type === "text" ? (
              <CaseStudyTextBlock
                section={blockSection}
                content={section.content as TextContent}
                previewMode={previewMode}
              />
            ) : null}
            {section.type === "media" ? (
              <CaseStudyMediaBlock
                section={blockSection}
                content={section.content as MediaContent}
                previewMode={previewMode}
              />
            ) : null}
            {section.type === "split" ? (
              <CaseStudySplitBlock
                section={blockSection}
                content={section.content as SplitContent}
                previewMode={previewMode}
              />
            ) : null}
            {section.type === "text_grid" ? (
              <CaseStudyTextGridBlock
                section={blockSection}
                content={section.content as TextGridContent}
                previewMode={previewMode}
              />
            ) : null}
            {section.type === "grid" ? (
              <CaseStudyGridBlock
                section={blockSection}
                content={section.content as GridContent}
                previewMode={previewMode}
              />
            ) : null}
            {section.type === "columns" ? (
              <CaseStudyColumnsBlock
                section={blockSection}
                content={section.content as ColumnsContent}
                previewMode={previewMode}
              />
            ) : null}
          </div>
          );
        })}
    </div>
  );
}
