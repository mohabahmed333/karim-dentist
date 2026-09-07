import { MediaFigure } from "../components/MediaFigure";
import type {
  GridContent,
  ParsedCaseStudySection,
} from "@/services/case_study_sections";

type Props = {
  section: ParsedCaseStudySection;
  content: GridContent;
  previewMode?: boolean;
};

export function CaseStudyGridBlock({
  section,
  content,
  previewMode,
}: Props) {
  const colClass = `cs-grid--cols-${content.columns}`;

  return (
    <section
      className={`cs-block cs-grid ${colClass}`}
      data-block-type="grid"
      data-layout={section.layout_variant}
    >
      <div className="cs-block-inner">
        <div className="cs-grid-items">
          {content.items.map((item, index) => (
            <figure
              key={`${section.id}-grid-${index}`}
              className="cs-grid-item cs-media-frame cs-aspect-1-1"
              data-customize-field={`section-${section.id}-grid-${index}`}
            >
              {item.media_url ? (
                <MediaFigure
                  src={item.media_url}
                  mediaType={item.media_type}
                  alt={item.alt}
                  previewMode={previewMode}
                  className="cs-media-el"
                  lazy={!previewMode}
                />
              ) : (
                <div className="cs-media-ph" aria-hidden />
              )}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
