import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  Home,
  LayoutGrid,
  Gauge,
  MessagesSquare,
  Settings,
  Users,
} from "lucide-react";
import type { AdminMessageKey } from "@/lib/i18n";
import { adminEn } from "@/lib/i18n/messages/admin/en";

export type AdminNavItem = {
  href: string;
  labelKey: AdminMessageKey;
  exact?: boolean;
  badge?: number;
};

export type AdminNavGroup = {
  id: string;
  labelKey: AdminMessageKey;
  /** When set, the group's own label is also a link (e.g. Reservations), not just a toggle. */
  href?: string;
  items: AdminNavItem[];
  defaultOpen?: boolean;
};

/** A plain item never has `items` — that's what tells the two apart in `entries`. */
export type AdminNavSectionEntry = AdminNavItem | AdminNavGroup;

export function isAdminNavGroup(
  entry: AdminNavSectionEntry,
): entry is AdminNavGroup {
  return "items" in entry;
}

export type AdminNavSection = {
  id: string;
  titleKey: AdminMessageKey;
  items?: AdminNavItem[];
  groups?: AdminNavGroup[];
  /**
   * Plain items and groups in the order they should render — unlike
   * items/groups (always all items, then all groups below), this lets a
   * group sit between two plain items instead of being pushed to the bottom.
   * Takes priority over items/groups when set.
   */
  entries?: AdminNavSectionEntry[];
};

export type AdminRailItem = {
  id: string;
  href: string;
  labelKey: AdminMessageKey;
  icon: LucideIcon;
  exact?: boolean;
};

export const adminRailItems: AdminRailItem[] = [
  {
    id: "overview",
    href: "/admin",
    labelKey: "admin.nav.overview",
    icon: Home,
    exact: true,
  },
  {
    id: "reservations",
    href: "/admin/reservations",
    labelKey: "admin.nav.reservations",
    icon: CalendarDays,
  },
  {
    id: "patients",
    href: "/admin/patients",
    labelKey: "admin.nav.patients",
    icon: Users,
  },
  {
    id: "support",
    href: "/admin/support",
    labelKey: "admin.nav.support",
    icon: MessagesSquare,
  },
  {
    id: "customize",
    href: "/admin/customize",
    labelKey: "admin.nav.customize",
    icon: LayoutGrid,
  },
  {
    id: "usage",
    href: "/admin/usage",
    labelKey: "admin.nav.usage",
    icon: Gauge,
  },
  {
    id: "settings",
    href: "/admin/settings",
    labelKey: "admin.nav.settings",
    icon: Settings,
  },
];

export const adminNavSections: AdminNavSection[] = [
  {
    id: "clinic",
    titleKey: "admin.nav.clinic",
    entries: [
      { href: "/admin", labelKey: "admin.nav.overview", exact: true },
      {
        id: "reservations",
        labelKey: "admin.nav.reservations",
        href: "/admin/reservations",
        defaultOpen: true,
        items: [{ href: "/admin/waitlist", labelKey: "admin.nav.waitlist" }],
      },
      { href: "/admin/patients", labelKey: "admin.nav.patients" },
      { href: "/admin/support", labelKey: "admin.nav.support" },
      {
        id: "messaging",
        labelKey: "admin.nav.messagingGroup",
        defaultOpen: true,
        items: [
          { href: "/admin/quick-replies", labelKey: "admin.nav.quickReplies" },
          { href: "/admin/knowledge", labelKey: "admin.nav.knowledge" },
          { href: "/admin/assistant-review", labelKey: "admin.nav.assistantReview" },
          { href: "/admin/outbox", labelKey: "admin.nav.outbox" },
        ],
      },
    ],
  },
  {
    id: "site",
    titleKey: "admin.nav.site",
    items: [
      { href: "/admin/customize", labelKey: "admin.nav.customize" },
      { href: "/admin/usage", labelKey: "admin.nav.usage" },
      { href: "/admin/assist-analytics", labelKey: "admin.nav.assistAnalytics" },
      { href: "/admin/settings", labelKey: "admin.nav.settings" },
    ],
  },
];

export const adminPageLabelKeys: Record<string, AdminMessageKey> = {
  "/admin": "admin.nav.overview",
  "/admin/reservations": "admin.nav.reservations",
  "/admin/patients": "admin.nav.patients",
  "/admin/support": "admin.nav.support",
  "/admin/hero": "admin.nav.hero",
  "/admin/about": "admin.nav.about",
  "/admin/homepage-order": "admin.nav.homepageOrder",
  "/admin/case-studies": "admin.nav.caseStudies",
  "/admin/featured": "admin.nav.featured",
  "/admin/services": "admin.nav.services",
  "/admin/faq": "admin.nav.faq",
  "/admin/knowledge": "admin.nav.knowledge",
  "/admin/quick-replies": "admin.nav.quickReplies",
  "/admin/assistant-review": "admin.nav.assistantReview",
  "/admin/waitlist": "admin.nav.waitlist",
  "/admin/outbox": "admin.nav.outbox",
  "/admin/gallery": "admin.nav.gallery",
  "/admin/slider": "admin.nav.moreImages",
  "/admin/contact": "admin.nav.contact",
  "/admin/experience": "admin.nav.experience",
  "/admin/clients": "admin.nav.clients",
  "/admin/footer-links": "admin.nav.footerLinks",
  "/admin/callout": "admin.nav.callout",
  "/admin/customize": "admin.nav.customize",
  "/admin/usage": "admin.nav.usage",
  "/admin/assist-analytics": "admin.nav.assistAnalytics",
  "/admin/settings": "admin.nav.settings",
};

/** English fallbacks for non-React contexts */
export const adminPageLabels: Record<string, string> = Object.fromEntries(
  Object.entries(adminPageLabelKeys).map(([href, key]) => [href, adminEn[key]]),
);

export function flattenAdminNavItems(): AdminNavItem[] {
  return adminNavSections.flatMap((section) => {
    if (section.entries) {
      return section.entries.flatMap((entry) =>
        isAdminNavGroup(entry)
          ? [...(entry.href ? [{ href: entry.href, labelKey: entry.labelKey }] : []), ...entry.items]
          : [entry],
      );
    }
    return [
      ...(section.items ?? []),
      ...(section.groups?.flatMap((group) => group.items) ?? []),
    ];
  });
}
