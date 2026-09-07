"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import type { MediaImageItem } from "./collectConversationMedia";

type Props = {
  images: MediaImageItem[];
  index: number | null;
  onIndexChange: (index: number | null) => void;
  onClose: () => void;
};

export function ChatGalleryModal({
  images,
  index,
  onIndexChange,
  onClose,
}: Props) {
  const t = useTranslations();
  const touchStartX = useRef<number | null>(null);
  const open = index !== null && images.length > 0;
  const safeIndex =
    index === null || images.length === 0
      ? 0
      : Math.min(Math.max(index, 0), images.length - 1);
  const current = open ? images[safeIndex] : null;

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onIndexChange(
          safeIndex <= 0 ? images.length - 1 : safeIndex - 1,
        );
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        onIndexChange(
          safeIndex >= images.length - 1 ? 0 : safeIndex + 1,
        );
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [images.length, onClose, onIndexChange, open, safeIndex]);

  if (!open || !current || typeof document === "undefined") return null;

  function go(delta: number) {
    if (images.length === 0) return;
    const next = (safeIndex + delta + images.length) % images.length;
    onIndexChange(next);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/85"
      role="dialog"
      aria-modal="true"
      aria-label={t("admin.frontDesk.chatGalleryAria")}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 text-white">
        <p className="text-sm font-medium tabular-nums">
          {t("admin.frontDesk.chatGalleryCount")
            .replace("{current}", String(safeIndex + 1))
            .replace("{total}", String(images.length))}
        </p>
        <div className="flex items-center gap-1">
          <a
            href={current.url}
            download={current.name ?? "image"}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-sm hover:bg-white/20"
          >
            <Download className="h-4 w-4" />
            {t("admin.frontDesk.download")}
          </a>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 p-2 hover:bg-white/20"
            aria-label={t("admin.frontDesk.chatGalleryClose")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-12 py-4"
        onClick={onClose}
        onTouchStart={(e) => {
          touchStartX.current = e.changedTouches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const start = touchStartX.current;
          touchStartX.current = null;
          if (start == null) return;
          const end = e.changedTouches[0]?.clientX ?? start;
          const dx = end - start;
          if (Math.abs(dx) < 48) return;
          go(dx < 0 ? 1 : -1);
        }}
      >
        {images.length > 1 ? (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
              className="absolute start-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              aria-label={t("admin.frontDesk.chatGalleryPrev")}
            >
              <ChevronLeft className="h-6 w-6 rtl:rotate-180" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
              className="absolute end-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              aria-label={t("admin.frontDesk.chatGalleryNext")}
            >
              <ChevronRight className="h-6 w-6 rtl:rotate-180" />
            </button>
          </>
        ) : null}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.url}
          alt={current.name ?? t("admin.frontDesk.image")}
          className="max-h-full max-w-full object-contain"
          onClick={(e) => e.stopPropagation()}
          draggable={false}
        />
      </div>

      {images.length > 1 ? (
        <div className="flex shrink-0 gap-2 overflow-x-auto px-4 py-3">
          {images.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onIndexChange(i)}
              className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-md ring-2 ${
                i === safeIndex ? "ring-white" : "ring-transparent opacity-70"
              }`}
              aria-label={t("admin.frontDesk.chatGalleryThumb").replace(
                "{n}",
                String(i + 1),
              )}
              aria-current={i === safeIndex ? "true" : undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>,
    document.body,
  );
}
