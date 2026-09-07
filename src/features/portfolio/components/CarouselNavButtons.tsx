"use client";

import type { EmblaCarouselType } from "embla-carousel";
import { useEffect, useState } from "react";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Props = {
  api: EmblaCarouselType | undefined;
  className?: string;
};

const btnClass =
  "flex h-9 w-9 items-center justify-center border border-[#d7dbe2] bg-white text-lg text-[#0f2744] transition-colors hover:border-[#0f2744] disabled:pointer-events-none disabled:opacity-35 rtl:rotate-180";

export function CarouselNavButtons({ api, className }: Props) {
  const t = useTranslations();
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  useEffect(() => {
    if (!api) return;
    const sync = () => {
      setCanPrev(api.canScrollPrev());
      setCanNext(api.canScrollNext());
    };
    sync();
    api.on("select", sync);
    api.on("reInit", sync);
    return () => {
      api.off("select", sync);
      api.off("reInit", sync);
    };
  }, [api]);

  return (
    <div className={cn("flex gap-1.5", className)} data-customize-ignore="">
      <button
        type="button"
        className={btnClass}
        aria-label={t("sliderPrev")}
        disabled={!canPrev}
        onClick={(event) => {
          event.stopPropagation();
          api?.scrollPrev();
        }}
      >
        ‹
      </button>
      <button
        type="button"
        className={btnClass}
        aria-label={t("sliderNext")}
        disabled={!canNext}
        onClick={(event) => {
          event.stopPropagation();
          api?.scrollNext();
        }}
      >
        ›
      </button>
    </div>
  );
}
