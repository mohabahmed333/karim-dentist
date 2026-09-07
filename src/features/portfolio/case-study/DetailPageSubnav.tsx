"use client";

import { createPortal } from "react-dom";
import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { CaseStudyPageBack } from "./CaseStudyPageBack";
import { useDetailSubnavNavSync } from "../hooks/useDetailSubnavNavSync";

type Props = {
  href: string;
  label: string;
  onBackClick?: () => void;
};

function useHasDocument() {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
}

export function DetailPageSubnav({ href, label, onBackClick }: Props) {
  const pathname = usePathname();
  const hasDocument = useHasDocument();
  const inCustomize = pathname.startsWith("/admin/customize");

  // Stay fixed + clickable while scrolling; only pin to top when main nav hides.
  useDetailSubnavNavSync("detail-page-subnav", hasDocument);

  const bar = (
    <div
      id="detail-page-subnav"
      className="detail-page-subnav"
      data-customize-ignore
    >
      <div className="detail-page-subnav-inner">
        <CaseStudyPageBack
          href={href}
          label={label}
          onBackClick={onBackClick}
        />
      </div>
    </div>
  );

  if (!hasDocument || inCustomize) return bar;
  return createPortal(bar, document.body);
}
