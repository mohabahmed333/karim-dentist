export type NavLink = { href: string; label: string };

export const MENU_GROUPS = [
  {
    label: "Work",
    links: [
      { href: "/case-studies", label: "Case studies" },
      { href: "/featured", label: "Featured" },
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
  return links;
}

export function buildMenuGroups(workLinks?: NavLink[]) {
  return MENU_GROUPS.map((group) =>
    group.label === "Work"
      ? { ...group, links: workLinks ?? [...group.links] }
      : group,
  );
}
