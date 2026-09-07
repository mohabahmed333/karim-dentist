import { forwardRef } from "react";
import type { Tables } from "@/lib/supabase/database.types";

type Props = {
  hero: Tables<"hero">;
};

export const HeroCopy = forwardRef<HTMLDivElement, Props>(function HeroCopy(
  { hero },
  ref,
) {
  const title = [hero.headline, hero.accent].filter(Boolean).join(" ").trim();
  const headlineImage = hero.headline_image_url?.trim() || null;

  return (
    <div className="hero-copy" ref={ref}>
      <div className="hero-title-stack">
        {hero.kicker ? <p className="hero-kicker">{hero.kicker}</p> : null}
        {headlineImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="hero-headline-image"
            src={headlineImage}
            alt={title || hero.kicker || "Hero title"}
          />
        ) : title ? (
          <h1>{title}</h1>
        ) : null}
      </div>
    </div>
  );
});
