"use client";

import Image from "next/image";
import Link from "next/link";
import { mediaSrc } from "@/features/portfolio/lib/mediaSrc";

type Props = {
  href: string | null;
  imageUrl: string | null;
  title: string;
  description?: string;
  itemId: string;
};

export function DentalWorkCard({
  href,
  imageUrl,
  title,
  description,
  itemId,
}: Props) {
  const image = mediaSrc(imageUrl);
  const body = (
    <>
      {image ? (
        <div
          className="overflow-hidden rounded-[24px] border border-[#e6e8ec] bg-[#f7f8fa]"
          data-customize-field="image_url"
        >
          <Image
            src={image}
            alt={title}
            width={640}
            height={420}
            className="h-52 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </div>
      ) : null}
      <h3
        className="mt-3 text-base font-semibold text-[#0f2744]"
        data-customize-field="title"
      >
        {title}
      </h3>
      {description ? (
        <p
          className="mt-1 line-clamp-2 text-sm text-[#6b7280]"
          data-customize-field="description"
        >
          {description}
        </p>
      ) : null}
    </>
  );

  const className = "group block text-left";
  if (href) {
    return (
      <Link href={href} className={className} data-customize-item={itemId}>
        {body}
      </Link>
    );
  }
  return (
    <article className={className} data-customize-item={itemId}>
      {body}
    </article>
  );
}
