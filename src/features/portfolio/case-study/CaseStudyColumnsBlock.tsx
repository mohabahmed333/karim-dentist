import type {
  ColumnsContent,
  ParsedCaseStudySection,
} from "@/services/case_study_sections";
import { CaseStudyColumnSlot } from "./CaseStudyColumnSlot";

type Props = {
  section: ParsedCaseStudySection;
  content: ColumnsContent;
  previewMode?: boolean;
};

export function CaseStudyColumnsBlock({
  section,
  content,
  previewMode,
}: Props) {
  return (
    <section
      className="cs-block cs-columns"
      data-block-type="columns"
      data-layout={section.layout_variant}
    >
      <div className="cs-block-inner">
        <div className="cs-columns-grid">
          {content.slots.map((slot, index) => (
            <CaseStudyColumnSlot
              key={`${section.id}-col-${index}`}
              slot={slot}
              index={index}
              sectionId={section.id}
              previewMode={previewMode}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
