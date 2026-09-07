"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  href: string;
  label: string;
  onBackClick?: () => void;
};

function BackArrow() {
  return (
    <span aria-hidden className="inline-block rtl:rotate-180">
      ←
    </span>
  );
}

export function DentalBackLink({ href, label, onBackClick }: Props) {
  const className = cn(
    "mb-8 inline-flex items-center gap-1.5 rounded-full border border-[#e6e8ec] px-4 py-1.5 text-sm text-[#6b7280] hover:border-[#0f2744] hover:text-[#0f2744]",
  );

  const content = (
    <>
      <BackArrow />
      <span>{label}</span>
    </>
  );

  if (onBackClick) {
    return (
      <button
        type="button"
        className={className}
        data-customize-ignore
        onClick={onBackClick}
      >
        {content}
      </button>
    );
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}
