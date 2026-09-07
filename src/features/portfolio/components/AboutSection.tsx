import type { Tables } from "@/lib/supabase/database.types";
import { mediaSrc } from "@/features/portfolio/lib/mediaSrc";
import { MediaFigure } from "./MediaFigure";
import { AboutDropCap } from "./AboutDropCap";

type Props = {
  about: Tables<"about">;
};

function aboutParagraphs(body: string, dropCap: string): string[] {
  const parts = body
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return [];

  const [first, ...rest] = parts;
  if (!dropCap.trim()) return [first!, ...rest];

  const stripped = first!.replace(
    new RegExp(`^${escapeRegExp(dropCap.trim())}`, "i"),
    "",
  );
  return [stripped, ...rest];
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function AboutSection({ about }: Props) {
  const paragraphs = aboutParagraphs(about.body, about.drop_cap);
  const portrait = mediaSrc(about.image_url);
  const showDropCap = Boolean(
    about.drop_cap_logo_url?.trim() || about.drop_cap?.trim(),
  );

  return (
    <section className="about" id="about" data-customize-section="about">
      <div className="about-inner">
        <div className="about-grid">
          {portrait ? (
            <div className="about-frame">
              <MediaFigure
                src={portrait}
                mediaType={about.media_type}
                alt="Portrait"
              />
            </div>
          ) : null}
          <div className="about-copy">
            {paragraphs.length > 0 ? (
              paragraphs.map((paragraph, index) => {
                const isLeadParagraph = index === 0 && showDropCap;

                return (
                  <p
                    key={`${index}-${paragraph.slice(0, 24)}`}
                    className={isLeadParagraph ? "about-copy-lead" : undefined}
                  >
                    {isLeadParagraph ? (
                      <>
                        <AboutDropCap
                          letter={about.drop_cap}
                          logoUrl={about.drop_cap_logo_url}
                        />
                        <span className="about-copy-lead-text">{paragraph}</span>
                      </>
                    ) : (
                      paragraph
                    )}
                  </p>
                );
              })
            ) : about.copy_image_url ? (
              <MediaFigure
                src={about.copy_image_url}
                mediaType={about.copy_media_type}
                alt="About"
                className="about-copy-media"
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
