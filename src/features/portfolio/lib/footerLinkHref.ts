import type { Tables } from "../../../lib/supabase/database.types";

function norm(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function isCaseStudiesLink(link: Tables<"footer_links">) {
  const label = norm(link.label);
  const href = (link.href ?? "").trim();
  return (
    label === "case studies" ||
    href === "#case-studies" ||
    href === "/case-studies"
  );
}

function isFeaturedLink(link: Tables<"footer_links">) {
  const label = norm(link.label);
  const href = (link.href ?? "").trim();
  return (
    label === "projects" ||
    label === "featured projects" ||
    href === "#featured" ||
    href === "/featured"
  );
}

export function isContactFooterLink(
  link: Pick<Tables<"footer_links">, "label" | "href">,
) {
  const label = norm(link.label);
  const href = (link.href ?? "").trim();
  return (
    label === "contact" ||
    href === "#contact" ||
    href === "#contact-popup" ||
    href === "/#contact"
  );
}

export function isReservedFooterLink(link: Tables<"footer_links">) {
  return isContactFooterLink(link);
}

/** Footer href that works from any route (detail pages, index, home). */
export function resolveFooterLink(link: Tables<"footer_links">): {
  label: string;
  href: string;
} {
  const href = (link.href ?? "").trim();

  if (isContactFooterLink(link)) {
    return { label: link.label || "Contact", href: "#contact-popup" };
  }
  if (isCaseStudiesLink(link)) {
    return { label: "Case Studies", href: "/case-studies" };
  }
  if (isFeaturedLink(link)) {
    return { label: "Featured Projects", href: "/featured" };
  }
  if (norm(link.label) === "experience" || href === "#experience") {
    return { label: "Experience", href: "/experience" };
  }
  if (norm(link.label) === "home" || href === "#top" || href === "/#top") {
    return { label: link.label || "Home", href: "/" };
  }
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return { label: link.label, href };
  }
  if (href.startsWith("/")) {
    return { label: link.label, href };
  }
  if (href.startsWith("#")) {
    return { label: link.label, href: `/${href}` };
  }
  return { label: link.label, href: href || "/" };
}

export function isExternalFooterHref(href: string) {
  return href.startsWith("http://") || href.startsWith("https://");
}

export function isHomeFooterHref(href: string) {
  return href === "/" || href === "/#top" || href === "#top";
}
