"use client";

import type { Tables } from "@/lib/supabase/database.types";
import { pickLocalized, useLocale } from "@/lib/i18n";
import {
  FooterPresetIcon,
  isFooterIconKey,
} from "../lib/footerIcons";
import { resolveFooterLink } from "../lib/footerLinkHref";

export { resolveFooterLink } from "../lib/footerLinkHref";

export function FooterLinkContent({
  link,
}: {
  link: Tables<"footer_links">;
}) {
  const { locale } = useLocale();
  const resolved = resolveFooterLink(link);
  const label = pickLocalized(locale, resolved.label, link.label_ar);

  if (link.display_mode !== "icon") return label;

  if (link.icon_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={link.icon_url} alt="" className="footer-icon-img" />
    );
  }

  if (link.icon_key && isFooterIconKey(link.icon_key)) {
    return <FooterPresetIcon iconKey={link.icon_key} />;
  }

  return label;
}
