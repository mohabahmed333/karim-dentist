"use client";

import Link from "next/link";

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

export function CaseStudyPageBack({ href, label, onBackClick }: Props) {
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
        className="cs-page-back inline-flex items-center gap-1.5"
        data-customize-ignore
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onBackClick();
        }}
      >
        {content}
      </button>
    );
  }

  return (
    <Link href={href} className="cs-page-back inline-flex items-center gap-1.5">
      {content}
    </Link>
  );
}
