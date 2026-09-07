export type NavLink = { href: string; label: string };

export const MENU_GROUPS = [
  {
    label: "Work",
    links: [
      { href: "/case-studies", label: "Case studies" },
      { href: "/featured", label: "Featured" },
      { href: "/services", label: "Services" },
      { href: "/experience", label: "Experience" },
    ],
  },
  {
    label: "Studio",
    links: [
      { href: "#about", label: "About" },
      { href: "#clients", label: "Clients" },
    ],
  },
  {
    label: "Connect",
    links: [
      { href: "#contact", label: "Contact" },
      { href: "/", label: "Home" },
    ],
  },
] as const;

export function buildWorkNavLinks(
  caseStudyCount: number,
  featuredCount: number,
): NavLink[] {
  const links: NavLink[] = [];
  if (caseStudyCount > 0) {
    links.push({ href: "/case-studies", label: "Case studies" });
  }
  if (featuredCount > 0) {
    links.push({ href: "/featured", label: "Featured" });
  }
  links.push({ href: "/services", label: "Services" });
  links.push({ href: "/experience", label: "Experience" });
  return links;
}

export function buildMenuGroups(workLinks?: NavLink[]) {
  return MENU_GROUPS.map((group) =>
    group.label === "Work"
      ? { ...group, links: workLinks ?? [...group.links] }
      : group,
  );
}
