import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  History,
  Home,
  Inbox,
  LayoutGrid,
  Gauge,
  MessagesSquare,
  Receipt,
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
  /**
   * The icon opens its list and nothing else — `href` is only the path prefix
   * that marks it active. Settings is one: every page under it is a child, so
   * offering its own label in the flyout is a second way to reach a page that
   * is already listed one line below.
   */
  container?: boolean;
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
      // A deposit belongs to a booking, same permission as the reservations list.
      { href: "/admin/deposits", labelKey: "admin.nav.deposits", permission: "reservations.view" },
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
    id: "billing",
    href: "/admin/billing",
    labelKey: "admin.nav.billing",
    icon: Receipt,
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
    children: [
      { href: "/admin/assist-analytics", labelKey: "admin.nav.assistAnalytics", permission: "assist-analytics.view" },
    ],
  },
  {
    id: "logs",
    href: "/admin/system-log",
    labelKey: "admin.nav.logs",
    icon: History,
    container: true,
    children: [
      { href: "/admin/system-log", labelKey: "admin.nav.systemLog", permission: "system-log.view" },
      { href: "/admin/ai-actions", labelKey: "admin.nav.aiActions", permission: "ai-actions.view" },
    ],
  },
  {
    id: "settings",
    href: "/admin/settings",
    labelKey: "admin.nav.settings",
    icon: Settings,
    permission: "settings.view",
    container: true,
    children: [
      { href: "/admin/settings/theme", labelKey: "admin.settings.theme", permission: "settings.view" },
      { href: "/admin/settings/clinic-hours", labelKey: "admin.settings.hours", permission: "settings.view" },
      { href: "/admin/settings/site", labelKey: "admin.settings.brand", permission: "settings.view" },
      { href: "/admin/settings/clinic-prices", labelKey: "admin.settings.clinic", permission: "settings.view" },
      { href: "/admin/settings/whatsapp-ai", labelKey: "admin.settings.whatsappAi", permission: "settings.view" },
      { href: "/admin/settings/patient-notifications", labelKey: "admin.settings.notifications", permission: "settings.view" },
      { href: "/admin/settings/deposits", labelKey: "admin.settings.deposits", permission: "settings.view" },
      { href: "/admin/settings/templates", labelKey: "admin.settings.templates", permission: "settings.view" },
      { href: "/admin/settings/doctors", labelKey: "admin.settings.doctors", permission: "settings.view" },
      { href: "/admin/settings/accounts", labelKey: "admin.nav.accounts", permission: "accounts.view" },
      { href: "/admin/settings/roles", labelKey: "admin.nav.roles", permission: "roles.view" },
    ],
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
          // A deposit belongs to a booking, and the page gates on the same
          // permission the reservations list does.
          { href: "/admin/deposits", labelKey: "admin.nav.deposits", permission: "reservations.view" },
        ],
      },
      { href: "/admin/patients", labelKey: "admin.nav.patients", permission: "patients.view" },
      { href: "/admin/billing", labelKey: "admin.nav.billing", permission: "patients.view" },
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
    ],
    groups: [
      {
        id: "logs",
        labelKey: "admin.nav.logs",
        defaultOpen: false,
        items: [
          { href: "/admin/system-log", labelKey: "admin.nav.systemLog", permission: "system-log.view" },
          { href: "/admin/ai-actions", labelKey: "admin.nav.aiActions", permission: "ai-actions.view" },
        ],
      },
      {
        // No href on purpose: Settings is a container, and clicking it should
        // open the group rather than navigate. It had one because the
        // dashboard theme lived at /admin/settings; that page now sits in the
        // list below with its siblings.
        id: "settings",
        labelKey: "admin.nav.settings",
        defaultOpen: false,
        items: [
          { href: "/admin/settings/theme", labelKey: "admin.settings.theme", permission: "settings.view" },
          { href: "/admin/settings/clinic-hours", labelKey: "admin.settings.hours", permission: "settings.view" },
          { href: "/admin/settings/site", labelKey: "admin.settings.brand", permission: "settings.view" },
          { href: "/admin/settings/clinic-prices", labelKey: "admin.settings.clinic", permission: "settings.view" },
          { href: "/admin/settings/whatsapp-ai", labelKey: "admin.settings.whatsappAi", permission: "settings.view" },
          { href: "/admin/settings/patient-notifications", labelKey: "admin.settings.notifications", permission: "settings.view" },
          { href: "/admin/settings/deposits", labelKey: "admin.settings.deposits", permission: "settings.view" },
          { href: "/admin/settings/templates", labelKey: "admin.settings.templates", permission: "settings.view" },
          { href: "/admin/settings/doctors", labelKey: "admin.settings.doctors", permission: "settings.view" },
          { href: "/admin/settings/accounts", labelKey: "admin.nav.accounts", permission: "accounts.view" },
          { href: "/admin/settings/roles", labelKey: "admin.nav.roles", permission: "roles.view" },
        ],
      },
    ],
  },
];

export const adminPageLabelKeys: Record<string, AdminMessageKey> = {
  "/admin": "admin.nav.overview",
  "/admin/reservations": "admin.nav.reservations",
  "/admin/patients": "admin.nav.patients",
  "/admin/billing": "admin.nav.billing",
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
  "/admin/deposits": "admin.nav.deposits",
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
  "/admin/ai-actions": "admin.nav.aiActions",
  "/admin/system-log": "admin.nav.systemLog",
  "/admin/settings/theme": "admin.settings.theme",
  "/admin/settings/clinic-hours": "admin.settings.hours",
  "/admin/settings/site": "admin.settings.brand",
  "/admin/settings/clinic-prices": "admin.settings.clinic",
  "/admin/settings/whatsapp-ai": "admin.settings.whatsappAi",
  "/admin/settings/patient-notifications": "admin.settings.notifications",
  "/admin/settings/deposits": "admin.settings.deposits",
  "/admin/settings/templates": "admin.settings.templates",
  "/admin/settings/doctors": "admin.settings.doctors",
  // No adminPagePermissions entries on purpose: your own profile and password
  // are not privileged, so they stay visible to every role.
  "/admin/account/profile": "admin.nav.profile",
  "/admin/account/password": "admin.nav.changePassword",
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
  "/admin/billing": "patients.view",
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
  "/admin/deposits": "reservations.view",
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
  "/admin/ai-actions": "ai-actions.view",
  "/admin/system-log": "system-log.view",
  "/admin/settings/theme": "settings.view",
  "/admin/settings/clinic-hours": "settings.view",
  "/admin/settings/site": "settings.view",
  "/admin/settings/clinic-prices": "settings.view",
  "/admin/settings/whatsapp-ai": "settings.view",
  "/admin/settings/patient-notifications": "settings.view",
  "/admin/settings/deposits": "settings.view",
  "/admin/settings/templates": "settings.view",
  "/admin/settings/doctors": "settings.view",
  "/admin/settings/accounts": "accounts.view",
  "/admin/settings/roles": "roles.view",
};

/** English fallbacks for non-React contexts */
export const adminPageLabels: Record<string, string> = Object.fromEntries(
  Object.entries(adminPageLabelKeys).map(([href, key]) => [href, adminEn[key]]),
);

/**
 * UI-only nav filtering: hides items the current role can't see. This is a
 * convenience layered on top of the real enforcement in `requirePagePermission`
 * (pages) and `requirePermission` (actions) — it fails open (shows everything)
 * when `permissions` is null, so callers that don't fetch a session (demos,
 * showreel) keep working unfiltered.
 */
function isPermitted(
  permission: string | undefined,
  permissions: Set<string> | null,
): boolean {
  if (!permissions || !permission) return true;
  return permissions.has(permission);
}

export function filterAdminRailItems(
  items: AdminRailItem[],
  permissions: Set<string> | null,
): AdminRailItem[] {
  const result: AdminRailItem[] = [];
  for (const item of items) {
    const children = item.children?.filter((child) =>
      isPermitted(child.permission, permissions),
    );
    const ownPermitted = isPermitted(item.permission, permissions);
    const anyChildPermitted = (children?.length ?? 0) > 0;
    if (!ownPermitted && !anyChildPermitted) continue;
    result.push({ ...item, children });
  }
  return result;
}

function filterAdminNavGroup(
  group: AdminNavGroup,
  permissions: Set<string> | null,
): AdminNavGroup | null {
  const items = group.items.filter((item) =>
    isPermitted(item.permission, permissions),
  );
  // Only a group with its own link is worth showing empty — a pure
  // toggle/container group (no href) with no visible children is just an
  // empty expander, so hide it rather than leave a dead-end in the sidebar.
  const hasOwnLink = Boolean(group.href) && isPermitted(group.permission, permissions);
  if (!hasOwnLink && items.length === 0) return null;
  return { ...group, items };
}

export function filterAdminNavSections(
  sections: AdminNavSection[],
  permissions: Set<string> | null,
): AdminNavSection[] {
  const result: AdminNavSection[] = [];
  for (const section of sections) {
    if (section.entries) {
      const entries: AdminNavSectionEntry[] = [];
      for (const entry of section.entries) {
        if (isAdminNavGroup(entry)) {
          const filtered = filterAdminNavGroup(entry, permissions);
          if (filtered) entries.push(filtered);
        } else if (isPermitted(entry.permission, permissions)) {
          entries.push(entry);
        }
      }
      if (entries.length > 0) result.push({ ...section, entries });
      continue;
    }

    const items = section.items?.filter((item) =>
      isPermitted(item.permission, permissions),
    );
    const groups: AdminNavGroup[] = [];
    for (const group of section.groups ?? []) {
      const filtered = filterAdminNavGroup(group, permissions);
      if (filtered) groups.push(filtered);
    }
    if ((items?.length ?? 0) === 0 && groups.length === 0) continue;
    result.push({ ...section, items, groups });
  }
  return result;
}

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

function hrefMatches(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Which collapsible group (if any) the current page lives under — the
 * sidebar opens that one and closes every other group, so drilling into
 * Settings doesn't leave Reservations/Messaging sitting open behind it.
 */
export function findActiveAdminNavGroupId(
  sections: AdminNavSection[],
  pathname: string,
): string | null {
  for (const section of sections) {
    const groups =
      section.groups ??
      (section.entries?.filter(isAdminNavGroup) as AdminNavGroup[] | undefined) ??
      [];
    for (const group of groups) {
      if (group.href && hrefMatches(pathname, group.href)) return group.id;
      if (group.items.some((item) => hrefMatches(pathname, item.href))) {
        return group.id;
      }
    }
  }
  return null;
}
