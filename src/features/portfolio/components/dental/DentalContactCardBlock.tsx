"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  cardImage: string;
  imageAlt: string;
  children: ReactNode;
  className?: string;
};

export function DentalContactCardBlock({
  cardImage,
  imageAlt,
  children,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "relative isolate h-full min-h-[28rem] overflow-hidden border border-[#e6e8ec]",
        className,
      )}
      data-customize-field="contact_card_image_url"
    >
      <Image
        src={cardImage}
        alt={imageAlt}
        fill
        sizes="(max-width: 1024px) 100vw, 50vw"
        className="object-cover"
        priority={false}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-black/65"
      />
      <div className="relative z-10 flex h-full min-h-[28rem] flex-col justify-between gap-8 p-6 sm:p-8">
        {children}
      </div>
    </div>
  );
}
