"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useTranslations } from "@/lib/i18n";

type GalleryLightboxProps = {
  open: boolean;
  src: string;
  alt: string;
  onClose: () => void;
};

export function GalleryLightbox({ open, src, alt, onClose }: GalleryLightboxProps) {
  const t = useTranslations();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      id="lightbox"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t("lightboxAria")}
    >
      <button
        type="button"
        className="absolute inset-0"
        aria-label={t("lightboxCloseAria")}
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[90vh] max-w-5xl overflow-hidden rounded-[22px] bg-white p-2">
        <button
          id="lightbox-close"
          type="button"
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-2xl text-white"
          aria-label={t("lightboxCloseAria")}
          onClick={onClose}
        >
          ×
        </button>
        {src ? (
          <Image
            id="lightbox-img"
            src={src}
            alt={alt}
            width={1400}
            height={1000}
            className="max-h-[85vh] w-auto object-contain"
          />
        ) : null}
      </div>
    </div>
  );
}
