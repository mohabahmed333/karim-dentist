import type { CSSProperties, ReactNode } from "react";
import type { ShowreelCopySlide, ShowreelFeatureSlide } from "./showreelSlides";

function splitWords(text: string) {
  return text.split(/\s+/).filter(Boolean);
}

function ShowreelWordLines({
  text,
  className,
}: {
  text: string;
  className: string;
}) {
  const words = splitWords(text);

  return (
    <h2 className={className} aria-label={text}>
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          className="showreel-anim-word"
          style={{ "--word-i": i } as CSSProperties}
          aria-hidden="true"
        >
          {word}
        </span>
      ))}
    </h2>
  );
}

type ShellProps = {
  index: number;
  total: number;
  kicker: string;
  title: string;
  body: string;
  tags?: string[];
  compact?: boolean;
  children?: ReactNode;
};

export function ShowreelSlideShell({
  kicker,
  title,
  body,
  tags = [],
  compact,
  children,
}: ShellProps) {
  return (
    <div className={compact ? "showreel-scene-copy is-compact" : "showreel-scene-copy"}>
      <p className="showreel-kicker showreel-anim-kicker">{kicker}</p>

      {!compact ? (
        <h2 className="showreel-headline showreel-anim-title">{title}</h2>
      ) : null}

      {!compact && body ? (
        <p className="showreel-lede showreel-anim-body">{body}</p>
      ) : null}

      {tags.length > 0 ? (
        <ul className="showreel-keywords" aria-label="Keywords">
          {tags.map((tag, i) => (
            <li
              key={tag}
              className="showreel-anim-keyword"
              style={{ "--kw-i": i } as CSSProperties}
            >
              {tag}
            </li>
          ))}
        </ul>
      ) : null}

      {children}
    </div>
  );
}

type CopyProps = {
  slide: ShowreelCopySlide;
  index: number;
  total: number;
};

export function ShowreelSlideCopy({ slide, index, total }: CopyProps) {
  const isIntro = slide.kind === "copy" && index === 0;
  const isOutro = slide.kind === "outro";

  if (isIntro) {
    return (
      <div className="showreel-scene showreel-scene--hero showreel-scene--intro">
        <div className="showreel-scene-copy showreel-intro-core">
          <p className="showreel-intro-meta showreel-anim-kicker">
            <span className="showreel-intro-index">01</span>
            <span className="showreel-intro-name">{slide.kicker}</span>
          </p>

          {slide.tags?.length ? (
            <ul className="showreel-intro-lines" aria-label="Keywords">
              {slide.tags.map((tag, i) => (
                <li
                  key={tag}
                  className={`showreel-intro-line showreel-intro-line--${i + 1}${
                    i < 2 ? " showreel-intro-line--hook" : ""
                  } showreel-anim-keyword`}
                  style={{ "--line-i": i } as CSSProperties}
                >
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}

          {slide.body ? (
            <p className="showreel-intro-body showreel-anim-body">{slide.body}</p>
          ) : null}
        </div>
      </div>
    );
  }

  if (isOutro) {
    return (
      <div className="showreel-scene showreel-scene--hero showreel-scene--outro">
        <div className="showreel-scene-copy showreel-outro-core">
          <div className="showreel-outro-lines">
            <p className="showreel-outro-line showreel-outro-line--credit">
              <span className="showreel-outro-label">{slide.kicker}</span>
              <span className="showreel-outro-name">{slide.title}</span>
            </p>
            {slide.body ? (
              <p className="showreel-outro-line showreel-outro-line--next">
                {slide.body}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="showreel-scene showreel-scene--hero">
      <ShowreelSlideShell
        index={index}
        total={total}
        kicker={slide.kicker}
        title={slide.title}
        body={slide.body}
        tags={slide.tags}
      />
    </div>
  );
}

export type { ShowreelFeatureSlide };
