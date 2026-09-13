import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  Home,
  Inbox,
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
  /** Permission key required to see/use this item. Omit to always show it. */
  permission?: string;
};

export type AdminNavGroup = {
  id: string;
  labelKey: AdminMessageKey;
  /** When set, the group's own label is also a link (e.g. Reservations), not just a toggle. */
  href?: string;
  /** Permission key required to see/use the group's own link, if it has one. */
  permission?: string;
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
  /** Permission key required to see/use this item's own link. */
  permission?: string;
  /** Shown as a click-to-open dropdown flyout when the sidebar is the narrow icon rail. */
  children?: { href: string; labelKey: AdminMessageKey; permission?: string }[];
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
    permission: "reservations.view",
    children: [
      { href: "/admin/waitlist", labelKey: "admin.nav.waitlist", permission: "waitlist.view" },
    ],
  },
  {
    id: "patients",
    href: "/admin/patients",
    labelKey: "admin.nav.patients",
    icon: Users,
    permission: "patients.view",
  },
  {
    id: "support",
    href: "/admin/support",
    labelKey: "admin.nav.support",
    icon: MessagesSquare,
    permission: "support.view",
  },
  {
    id: "messaging",
    href: "/admin/quick-replies",
    labelKey: "admin.nav.messagingGroup",
    icon: Inbox,
    permission: "quick-replies.view",
    children: [
      { href: "/admin/quick-replies", labelKey: "admin.nav.quickReplies", permission: "quick-replies.view" },
      { href: "/admin/knowledge", labelKey: "admin.nav.knowledge", permission: "knowledge.view" },
      { href: "/admin/assistant-review", labelKey: "admin.nav.assistantReview", permission: "assistant-review.view" },
      { href: "/admin/outbox", labelKey: "admin.nav.outbox", permission: "outbox.view" },
    ],
  },
  {
    id: "customize",
    href: "/admin/customize",
    labelKey: "admin.nav.customize",
    icon: LayoutGrid,
    permission: "customize.view",
  },
  {
    id: "usage",
    href: "/admin/usage",
    labelKey: "admin.nav.usage",
    icon: Gauge,
    permission: "usage.view",
  },
  {
    id: "settings",
    href: "/admin/settings",
    labelKey: "admin.nav.settings",
    icon: Settings,
    permission: "settings.view",
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
        permission: "reservations.view",
        defaultOpen: true,
        items: [
          { href: "/admin/waitlist", labelKey: "admin.nav.waitlist", permission: "waitlist.view" },
        ],
      },
      { href: "/admin/patients", labelKey: "admin.nav.patients", permission: "patients.view" },
      { href: "/admin/support", labelKey: "admin.nav.support", permission: "support.view" },
      {
        id: "messaging",
        labelKey: "admin.nav.messagingGroup",
        defaultOpen: true,
        items: [
          { href: "/admin/quick-replies", labelKey: "admin.nav.quickReplies", permission: "quick-replies.view" },
          { href: "/admin/knowledge", labelKey: "admin.nav.knowledge", permission: "knowledge.view" },
          { href: "/admin/assistant-review", labelKey: "admin.nav.assistantReview", permission: "assistant-review.view" },
          { href: "/admin/outbox", labelKey: "admin.nav.outbox", permission: "outbox.view" },
        ],
      },
    ],
  },
  {
    id: "site",
    titleKey: "admin.nav.site",
    items: [
      { href: "/admin/customize", labelKey: "admin.nav.customize", permission: "customize.view" },
      { href: "/admin/usage", labelKey: "admin.nav.usage", permission: "usage.view" },
      { href: "/admin/assist-analytics", labelKey: "admin.nav.assistAnalytics", permission: "assist-analytics.view" },
      { href: "/admin/settings", labelKey: "admin.nav.settings", permission: "settings.view" },
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

/**
 * Permission key required to view each admin page, keyed the same way as
 * `adminPageLabelKeys`. Used by page-level guards (`requirePagePermission`)
 * and to filter command palette hits; nav visibility is filtered separately
 * via each nav entry's own `permission` field above.
 */
export const adminPagePermissions: Record<string, string> = {
  "/admin": "dashboard.view",
  "/admin/reservations": "reservations.view",
  "/admin/patients": "patients.view",
  "/admin/support": "support.view",
  "/admin/hero": "hero.view",
  "/admin/about": "about.view",
  "/admin/homepage-order": "homepage-order.view",
  "/admin/case-studies": "case-studies.view",
  "/admin/featured": "featured.view",
  "/admin/services": "services.view",
  "/admin/faq": "faq.view",
  "/admin/knowledge": "knowledge.view",
  "/admin/quick-replies": "quick-replies.view",
  "/admin/assistant-review": "assistant-review.view",
  "/admin/waitlist": "waitlist.view",
  "/admin/outbox": "outbox.view",
  "/admin/gallery": "gallery.view",
  "/admin/slider": "slider.view",
  "/admin/contact": "contact.view",
  "/admin/experience": "experience.view",
  "/admin/clients": "clients.view",
  "/admin/footer-links": "footer-links.view",
  "/admin/callout": "callout.view",
  "/admin/customize": "customize.view",
  "/admin/usage": "usage.view",
  "/admin/assist-analytics": "assist-analytics.view",
  "/admin/settings": "settings.view",
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
