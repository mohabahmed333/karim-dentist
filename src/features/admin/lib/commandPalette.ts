import { adminPageLabelKeys } from "@/features/admin/lib/adminNav";
import { CUSTOMIZE_SECTIONS } from "@/features/customize/types";
import { HOMEPAGE_SECTION_NAV } from "@/features/portfolio/lib/homepageSectionNav";
import {
  patientProfilePath,
  type PatientGroup,
} from "@/services/reservations/patientHistory";
import { scoreCommandHit } from "./commandSearch";

export const COMMAND_KINDS = [
  "page",
  "patient",
  "reservation",
  "service",
  "case-study",
  "project",
  "thread",
  "section",
  "public",
] as const;

export type CommandKind = (typeof COMMAND_KINDS)[number];

export type CommandHit = {
  id: string;
  kind: CommandKind;
  title: string;
  subtitle?: string;
  href: string;
  keywords: string;
};

export type CommandGroup = {
  kind: CommandKind;
  items: CommandHit[];
};

export const RECENT_STORAGE_KEY = "admin-command-recent";
const RECENT_LIMIT = 8;
const BROWSE_KINDS: ReadonlySet<CommandKind> = new Set([
  "page",
  "section",
  "public",
]);

export type CommandStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

export type StaticCommandLabels = {
  pageLabel: (href: string) => string;
  customizeLabel: (section: string) => string;
  publicHome: string;
  publicServices: string;
  publicCaseStudies: string;
  publicFeatured: string;
  publicExperience: string;
  newReservation: string;
};

export function filterCommandHits(hits: CommandHit[], query: string): CommandHit[] {
  if (!query.trim()) {
    return hits.filter((item) => BROWSE_KINDS.has(item.kind));
  }
  return hits
    .map((item) => ({ item, score: scoreCommandHit(item, query) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((row) => row.item);
}

export function groupCommandHits(hits: CommandHit[]): CommandGroup[] {
  const byKind = new Map<CommandKind, CommandHit[]>();
  for (const item of hits) {
    const list = byKind.get(item.kind);
    if (list) list.push(item);
    else byKind.set(item.kind, [item]);
  }
  return COMMAND_KINDS.flatMap((kind) => {
    const items = byKind.get(kind);
    return items?.length ? [{ kind, items: items.slice(0, 8) }] : [];
  });
}

export type CommandDisplayGroup = CommandGroup & { recent?: boolean };

/** Recents must be passed in — do not read window/localStorage during render. */
export function commandPaletteGroups(
  filtered: CommandHit[],
  query: string,
  recents: CommandHit[],
): CommandDisplayGroup[] {
  const grouped = groupCommandHits(filtered);
  if (query.trim() || recents.length === 0) return grouped;
  return [{ kind: "page", items: recents, recent: true }, ...grouped];
}

export function buildStaticCommandHits(labels: StaticCommandLabels): CommandHit[] {
  const pages = Object.keys(adminPageLabelKeys).map((href) => {
    const title = labels.pageLabel(href);
    return {
      id: `page:${href}`,
      kind: "page" as const,
      title,
      href,
      keywords: `admin page ${title}`,
    };
  });

  const customize = CUSTOMIZE_SECTIONS.map((section) => {
    const title = labels.customizeLabel(section);
    const href = `/admin/customize/${section}`;
    return {
      id: `section:${section}`,
      kind: "section" as const,
      title,
      subtitle: "Customize",
      href,
      keywords: `cms customize site ${section} ${title}`,
    };
  });

  const publicPages: CommandHit[] = [
    {
      id: "public:home",
      kind: "public",
      title: labels.publicHome,
      href: "/",
      keywords: "website homepage public site",
    },
    {
      id: "public:services",
      kind: "public",
      title: labels.publicServices,
      href: "/services",
      keywords: "website services page public",
    },
    {
      id: "public:case-studies",
      kind: "public",
      title: labels.publicCaseStudies,
      href: "/case-studies",
      keywords: "website case studies public",
    },
    {
      id: "public:featured",
      kind: "public",
      title: labels.publicFeatured,
      href: "/featured",
      keywords: "website featured projects public",
    },
    {
      id: "public:experience",
      kind: "public",
      title: labels.publicExperience,
      href: "/experience",
      keywords: "website experience public",
    },
  ];

  const sections: CommandHit[] = Object.entries(HOMEPAGE_SECTION_NAV).map(
    ([key, item]) => ({
      id: `public-section:${key}`,
      kind: "public",
      title: item.navLabel,
      subtitle: labels.publicHome,
      href: `/${item.href}`,
      keywords: `homepage section website ${key} ${item.navLabel}`,
    }),
  );

  const actions: CommandHit[] = [
    {
      id: "action-quick-book",
      kind: "page",
      title: labels.newReservation,
      href: "action:quick-book",
      keywords: "new reservation book appointment booking",
    },
  ];

  return [...pages, ...customize, ...publicPages, ...sections, ...actions];
}

export function hitsFromPatients(groups: PatientGroup[]): CommandHit[] {
  return groups.map((group) => ({
    id: `patient:${group.patientKey}`,
    kind: "patient" as const,
    title: group.displayName,
    subtitle: group.phone,
    href: patientProfilePath(group.patientKey),
    keywords: [
      group.displayName,
      group.phone,
      group.email ?? "",
      ...group.alternateNames,
    ].join(" "),
  }));
}

type ReservationSearchRow = {
  id: string;
  patient_name: string;
  phone: string;
  starts_at: string;
  service?: string | null;
};

export function hitsFromReservations(rows: ReservationSearchRow[]): CommandHit[] {
  return rows.map((row) => {
    const day = row.starts_at.slice(0, 10);
    const params = new URLSearchParams({
      selected: row.id,
      ...(day ? { date: day } : {}),
    });
    return {
      id: `reservation:${row.id}`,
      kind: "reservation" as const,
      title: row.patient_name,
      subtitle: row.service ?? undefined,
      href: `/admin/reservations?${params.toString()}`,
      keywords: `${row.patient_name} ${row.phone} ${row.service ?? ""} reservation`,
    };
  });
}

export function hitsFromServices(
  rows: { id: string; title: string; title_ar?: string | null; is_published?: boolean; tags?: string[] }[],
): CommandHit[] {
  return rows.map((row) => ({
    id: `service:${row.id}`,
    kind: "service" as const,
    title: row.title,
    subtitle: row.is_published === false ? "Draft" : undefined,
    href: row.is_published === false ? "/admin/customize/services" : "/services",
    keywords: `${row.title} ${row.title_ar ?? ""} ${(row.tags ?? []).join(" ")} service`,
  }));
}

export function hitsFromCaseStudies(
  rows: {
    id: string;
    title: string;
    title_ar?: string | null;
    slug?: string | null;
    is_published?: boolean;
    tags?: string[];
  }[],
): CommandHit[] {
  return rows.map((row) => {
    const publicHref =
      row.is_published && row.slug ? `/case-studies/${row.slug}` : null;
    return {
      id: `case-study:${row.id}`,
      kind: "case-study" as const,
      title: row.title,
      subtitle: publicHref ? "Published" : "Customize",
      href: publicHref ?? `/admin/customize/case-studies/${row.id}`,
      keywords: `${row.title} ${row.title_ar ?? ""} ${(row.tags ?? []).join(" ")} case study`,
    };
  });
}

export function hitsFromProjects(
  rows: {
    id: string;
    title: string;
    title_ar?: string | null;
    slug?: string | null;
    is_published?: boolean;
  }[],
): CommandHit[] {
  return rows.map((row) => {
    const publicHref =
      row.is_published && row.slug ? `/featured/${row.slug}` : null;
    return {
      id: `project:${row.id}`,
      kind: "project" as const,
      title: row.title,
      subtitle: publicHref ? "Published" : "Customize",
      href: publicHref ?? `/admin/customize/slider/${row.id}`,
      keywords: `${row.title} ${row.title_ar ?? ""} featured project`,
    };
  });
}

export function hitsFromThreads(
  rows: { id: string; title: string }[],
): CommandHit[] {
  return rows.map((row) => ({
    id: `thread:${row.id}`,
    kind: "thread" as const,
    title: row.title || "Clinic Assist",
    href: "/admin/support",
    keywords: `${row.title} clinic assist chat thread`,
  }));
}

export function hitsFromConversations(
  rows: {
    id: string;
    contact_name: string | null;
    phone_number: string;
  }[],
): CommandHit[] {
  return rows.map((row) => ({
    id: `wa:${row.id}`,
    kind: "thread" as const,
    title: row.contact_name || row.phone_number,
    subtitle: row.contact_name ? row.phone_number : undefined,
    href: "/admin/support",
    keywords: `${row.contact_name ?? ""} ${row.phone_number} whatsapp front desk`,
  }));
}

function readRecentIds(storage: CommandStorage): string[] {
  try {
    const raw = storage.getItem(RECENT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

export function pushRecentId(id: string, storage: CommandStorage): void {
  const next = [id, ...readRecentIds(storage).filter((item) => item !== id)].slice(
    0,
    RECENT_LIMIT,
  );
  storage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
}

export function recentHits(hits: CommandHit[], storage: CommandStorage): CommandHit[] {
  const byId = new Map(hits.map((item) => [item.id, item]));
  return readRecentIds(storage).flatMap((id) => {
    const item = byId.get(id);
    return item ? [item] : [];
  });
}
