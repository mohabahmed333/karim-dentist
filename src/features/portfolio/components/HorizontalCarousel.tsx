"use client";

import useEmblaCarousel from "embla-carousel-react";
import type { EmblaCarouselType } from "embla-carousel";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n";
import { useCarouselAutoplay } from "../hooks/useCarouselAutoplay";
import { shouldFireNearEnd } from "../lib/carouselNearEnd";
import { CarouselNavButtons } from "./CarouselNavButtons";

type Props = {
  children: React.ReactNode;
  className?: string;
  label?: string;
  itemCount?: number;
  onNearEnd?: () => void;
  autoplay?: boolean;
  autoplayDelayMs?: number;
  snap?: boolean;
  loop?: boolean;
  showButtons?: boolean;
  onApi?: (api: EmblaCarouselType | undefined) => void;
};

export function HorizontalCarousel({
  children,
  className = "",
  label = "Carousel",
  itemCount,
  onNearEnd,
  autoplay = false,
  autoplayDelayMs = 2800,
  snap = false,
  loop = false,
  showButtons = false,
  onApi,
}: Props) {
  const { dir } = useLocale();
  const shouldLoop = autoplay || loop;
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: shouldLoop ? false : "trimSnaps",
    dragFree: shouldLoop ? false : !snap,
    skipSnaps: shouldLoop ? false : !snap,
    loop: shouldLoop,
    direction: dir,
    watchFocus: false,
    watchResize: () => !document.hidden,
    watchDrag: (_api, event) => {
      const target = event.target;
      return !(
        target instanceof Element && target.closest("[data-no-carousel-drag]")
      );
    },
  });
  const [dragging, setDragging] = useState(false);
  const nearEndLock = useRef(false);
  useCarouselAutoplay(emblaApi, autoplay, autoplayDelayMs);

  useEffect(() => {
    onApi?.(emblaApi);
    return () => onApi?.(undefined);
  }, [emblaApi, onApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onDown = () => setDragging(true);
    const onUp = () => setDragging(false);
    emblaApi.on("pointerDown", onDown);
    emblaApi.on("pointerUp", onUp);
    const onVisibility = () => {
      if (document.hidden) return;
      window.requestAnimationFrame(() => emblaApi.reInit());
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      emblaApi.off("pointerDown", onDown);
      emblaApi.off("pointerUp", onUp);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi || itemCount === undefined) return;
    nearEndLock.current = false;
    window.requestAnimationFrame(() => emblaApi.reInit());
  }, [emblaApi, itemCount]);

  useEffect(() => {
    if (!emblaApi || !onNearEnd || autoplay) return;
    const check = () => {
      if (
        !shouldFireNearEnd(
          nearEndLock.current,
          emblaApi.scrollProgress(),
          emblaApi.canScrollNext(),
        )
      ) {
        return;
      }
      nearEndLock.current = true;
      onNearEnd();
    };
    emblaApi.on("scroll", check);
    emblaApi.on("settle", check);
    return () => {
      emblaApi.off("scroll", check);
      emblaApi.off("settle", check);
    };
  }, [autoplay, emblaApi, onNearEnd]);

  return (
    <div
      className={`carousel${dragging ? " is-dragging" : ""}${className ? ` ${className}` : ""}`}
    >
      {showButtons ? (
        <CarouselNavButtons api={emblaApi} className="mb-3 justify-end" />
      ) : null}
      <div className="carousel-viewport" ref={emblaRef} aria-label={label}>
        <div className="carousel-track">{children}</div>
      </div>
    </div>
  );
}
