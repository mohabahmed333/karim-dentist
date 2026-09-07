import type { Tables } from "@/lib/supabase/database.types";
import { isReservedFooterLink } from "../lib/footerLinkHref";
import { FooterNavLink } from "./FooterNavLink";
import { FooterTagline } from "./FooterTagline";

type Props = {
  tagline: string;
  taglineImageUrl?: string | null;
  email: string;
  footerLinks: Tables<"footer_links">[];
  socialLinks: Tables<"social_links">[];
  brand?: string;
};

const columns = [
  { key: "portfolio" as const, title: "Links" },
  { key: "follow" as const, title: "Follow Us" },
];

export function SiteFooter({
  tagline,
  taglineImageUrl,
  footerLinks,
  brand = "Imagineer",
}: Props) {
  return (
    <footer
      className="site-footer"
      id="contact"
      data-customize-section="footer"
      aria-label={`${brand} footer`}
    >
      <div className="footer-top">
        <div className="footer-brand">
          <FooterTagline text={tagline} imageUrl={taglineImageUrl} />
        </div>
        <div className="footer-cols">
          {columns.map((col) => (
            <div key={col.key} className="footer-col">
              <p className="footer-col-title">{col.title}</p>
              <ul>
                {footerLinks
                  .filter((l) => l.column_key === col.key)
                  .map((l) => {
                    const reserved = isReservedFooterLink(l);
                    return (
                    <li
                      key={l.id}
                      id={reserved ? undefined : `customize-item-${l.id}`}
                      data-customize-item={reserved ? undefined : l.id}
                      data-customize-ignore={reserved ? "" : undefined}
                    >
                      <FooterNavLink link={l} />
                    </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
