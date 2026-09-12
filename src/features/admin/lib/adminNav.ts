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
  items: AdminNavItem[];
  defaultOpen?: boolean;
};

export type AdminNavSection = {
  id: string;
  titleKey: AdminMessageKey;
  items?: AdminNavItem[];
  groups?: AdminNavGroup[];
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
    items: [
      { href: "/admin", labelKey: "admin.nav.overview", exact: true },
      { href: "/admin/reservations", labelKey: "admin.nav.reservations" },
      { href: "/admin/patients", labelKey: "admin.nav.patients" },
      { href: "/admin/support", labelKey: "admin.nav.support" },
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
  return adminNavSections.flatMap((section) => [
    ...(section.items ?? []),
    ...(section.groups?.flatMap((group) => group.items) ?? []),
  ]);
}
