"use client";

import {
  MediaUploadField,
  type MediaKind,
} from "@/features/admin/components/MediaUploadField";
import type { Tables } from "@/lib/supabase/database.types";

type Hero = Tables<"hero">;

type Props = {
  hero: Hero;
  patchHero: (partial: Partial<Hero>) => void;
};

export function HeroMediaFields({ hero, patchHero }: Props) {
  return (
    <>
      <MediaUploadField
        label="Desktop media"
        bucket="hero"
        folder="desktop"
        mediaType={(hero.media_type as MediaKind) ?? "video"}
        onMediaTypeChange={(media_type) => patchHero({ media_type })}
        value={hero.media_url_desktop}
        onChange={(media_url_desktop) =>
          patchHero({ media_url_desktop, media_url: media_url_desktop })
        }
      />
      <MediaUploadField
        label="Mobile media"
        bucket="hero"
        folder="mobile"
        mediaType={(hero.media_type as MediaKind) ?? "video"}
        onMediaTypeChange={(media_type) => patchHero({ media_type })}
        value={hero.media_url_mobile}
        onChange={(media_url_mobile) => patchHero({ media_url_mobile })}
      />
    </>
  );
}
