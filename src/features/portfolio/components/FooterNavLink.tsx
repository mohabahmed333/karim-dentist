"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Tables } from "@/lib/supabase/database.types";
import { pickLocalized, useLocale } from "@/lib/i18n";
import { openContactPopup } from "../lib/contactPopupBus";
import {
  isContactFooterLink,
  isExternalFooterHref,
  isHomeFooterHref,
  resolveFooterLink,
} from "../lib/footerLinkHref";
import { FooterLinkContent } from "./FooterLinkContent";

type Props = {
  link: Tables<"footer_links">;
};

function scrollHomeToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
  window.history.replaceState(null, "", "/");
}

export function FooterNavLink({ link }: Props) {
  const pathname = usePathname();
  const { locale } = useLocale();
  const resolved = resolveFooterLink(link);
  const label = pickLocalized(locale, resolved.label, link.label_ar);
  const isIcon = link.display_mode === "icon";
  const className = isIcon ? "footer-icon-link" : undefined;
  const content = <FooterLinkContent link={link} />;
  const onHome = pathname === "/" || pathname === "";

  if (isContactFooterLink(link)) {
    return (
      <button
        type="button"
        className={className ?? "footer-text-link"}
        aria-label={isIcon ? label : undefined}
        data-customize-ignore=""
        onClick={() => openContactPopup()}
      >
        {content}
      </button>
    );
  }

  if (isExternalFooterHref(resolved.href)) {
    return (
      <a
        href={resolved.href}
        className={className}
        aria-label={isIcon ? label : undefined}
        target="_blank"
        rel="noreferrer"
      >
        {content}
      </a>
    );
  }

  if (isHomeFooterHref(resolved.href)) {
    return (
      <Link
        href="/"
        className={className}
        aria-label={isIcon ? label : undefined}
        onClick={(event) => {
          if (!onHome) return;
          event.preventDefault();
          scrollHomeToTop();
        }}
      >
        {content}
      </Link>
    );
  }

  return (
    <Link
      href={resolved.href}
      className={className}
      aria-label={isIcon ? label : undefined}
    >
      {content}
    </Link>
  );
}
