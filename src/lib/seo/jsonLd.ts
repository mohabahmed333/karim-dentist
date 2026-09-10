import type { Locale } from "@/lib/i18n/LocaleProvider";
import { pickLocalized } from "@/lib/i18n/pickLocalized";
import { hasVisibleServiceTitle } from "@/features/portfolio/lib/serviceKindGroups";
import {
  externalHref,
  telegramHref,
  whatsappHref,
} from "@/features/portfolio/lib/contactInfo";
import {
  openingHoursSpecification,
  type OpeningHoursSpec,
} from "./openingHours";

/**
 * Minimal shape this module needs from each source. Kept narrow (rather than
 * importing the full generated Supabase types) so the builder stays easy to
 * unit test with plain fixtures.
 */
export type ClinicSettingsInput = {
  brand_name?: string | null;
  brand_logo_url?: string | null;
  contact_clinic_name?: string | null;
  contact_clinic_name_ar?: string | null;
  contact_doctor_name?: string | null;
  contact_doctor_name_ar?: string | null;
  contact_credentials?: string | null;
  contact_credentials_ar?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  contact_whatsapp?: string | null;
  contact_telegram?: string | null;
  contact_address?: string | null;
  contact_city?: string | null;
  contact_country?: string | null;
  contact_map_url?: string | null;
  contact_latitude?: number | null;
  contact_longitude?: number | null;
  contact_price_range?: string | null;
  contact_instagram?: string | null;
  contact_facebook?: string | null;
  contact_linkedin?: string | null;
  contact_x?: string | null;
  contact_behance?: string | null;
};

export type ClinicHoursInput = {
  open_weekdays: number[];
  time_windows: string[];
  timezone: string;
} | null;

export type ClinicServiceInput = {
  id: string;
  title?: string | null;
  title_ar?: string | null;
  description?: string | null;
  description_ar?: string | null;
  kind?: string | null;
  sort_order: number;
};

type BuildClinicGraphInput = {
  locale: Locale;
  /** Absolute origin, no trailing slash. */
  siteUrl: string;
  settings: ClinicSettingsInput | null;
  hours: ClinicHoursInput;
  services: ClinicServiceInput[];
};

/** Every schema.org node this module can emit, loosely typed on purpose —
 * callers read from a graph shaped like this, they don't construct it by hand. */
export type JsonLdNode = Record<string, unknown>;

export type JsonLdGraph = {
  "@context": "https://schema.org";
  "@graph": JsonLdNode[];
};

function text(value: string | null | undefined): string {
  return (value ?? "").trim();
}

/** Resolve a possibly-relative asset path against the graph's own siteUrl —
 * not the global getSiteUrl(), so the builder stays a pure function of its
 * inputs and is trivially testable with fixture origins. */
function resolveAssetUrl(siteUrl: string, value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  return `${siteUrl}${value.startsWith("/") ? value : `/${value}`}`;
}

function sameAsLinks(settings: ClinicSettingsInput): string[] {
  const links = [
    externalHref(text(settings.contact_instagram)),
    externalHref(text(settings.contact_facebook)),
    externalHref(text(settings.contact_linkedin)),
    externalHref(text(settings.contact_x)),
    externalHref(text(settings.contact_behance)),
    whatsappHref(text(settings.contact_whatsapp)),
    telegramHref(text(settings.contact_telegram)),
  ];
  return links.filter((href): href is string => Boolean(href));
}

/**
 * Single multi-typed clinic node. Deliberately not paired with a separate
 * Organization node: Dentist -> MedicalBusiness -> LocalBusiness already
 * inherits Organization, and a second node with a different @id would split
 * the entity across Google's Knowledge Graph.
 */
function buildClinicNode(
  siteUrl: string,
  settings: ClinicSettingsInput,
  hours: ClinicHoursInput,
  servicesCatalogId: string,
  doctorId: string,
): JsonLdNode {
  const clinicId = `${siteUrl}/#clinic`;
  const name = text(settings.contact_clinic_name) || text(settings.brand_name);
  const priceRange = text(settings.contact_price_range);
  const hasGeo =
    typeof settings.contact_latitude === "number" &&
    typeof settings.contact_longitude === "number";
  const specs: OpeningHoursSpec[] | null = openingHoursSpecification(hours);

  const node: JsonLdNode = {
    "@type": ["Dentist", "MedicalBusiness", "LocalBusiness"],
    "@id": clinicId,
    name,
    url: siteUrl,
    telephone: text(settings.contact_phone) || undefined,
    email: text(settings.contact_email) || undefined,
    // brand_logo_url is either a site-relative /public asset or a full
    // Supabase storage URL — never a bare domain, so this must resolve
    // against the site origin, not externalHref (which assumes a bare host).
    image: text(settings.brand_logo_url)
      ? resolveAssetUrl(siteUrl, text(settings.brand_logo_url))
      : undefined,
    logo: text(settings.brand_logo_url)
      ? resolveAssetUrl(siteUrl, text(settings.brand_logo_url))
      : undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: text(settings.contact_address) || undefined,
      addressLocality: text(settings.contact_city) || undefined,
      addressCountry: text(settings.contact_country) === "Egypt" ? "EG" : text(settings.contact_country) || undefined,
    },
    areaServed: ["New Cairo", "Cairo", "Egypt"],
    availableLanguage: ["en", "ar"],
    hasMap: text(settings.contact_map_url) || undefined,
    priceRange: priceRange || undefined,
    sameAs: sameAsLinks(settings),
    employee: { "@id": doctorId },
    hasOfferCatalog: { "@id": servicesCatalogId },
  };

  if (hasGeo) {
    node.geo = {
      "@type": "GeoCoordinates",
      latitude: settings.contact_latitude,
      longitude: settings.contact_longitude,
    };
  }
  if (specs) {
    node.openingHoursSpecification = specs;
  }

  return node;
}

function buildDoctorNode(
  siteUrl: string,
  locale: Locale,
  settings: ClinicSettingsInput,
  clinicId: string,
): JsonLdNode {
  const name = pickLocalized(
    locale,
    settings.contact_doctor_name,
    settings.contact_doctor_name_ar,
  );
  const credentials = pickLocalized(
    locale,
    settings.contact_credentials,
    settings.contact_credentials_ar,
  );
  return {
    "@type": "Person",
    "@id": `${siteUrl}/#dr-karim`,
    name,
    jobTitle: "Dentist",
    medicalSpecialty: "Dentistry",
    description: credentials || undefined,
    worksFor: { "@id": clinicId },
  };
}

function buildWebsiteNode(
  siteUrl: string,
  settings: ClinicSettingsInput,
  clinicId: string,
): JsonLdNode {
  // No potentialAction/SearchAction: the site has no public search (the
  // admin-only search routes don't count), and declaring a sitelinks
  // searchbox that doesn't exist is a spam signal.
  return {
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: siteUrl,
    name: text(settings.brand_name),
    inLanguage: ["en", "ar"],
    publisher: { "@id": clinicId },
  };
}

function buildServicesGraph(
  siteUrl: string,
  locale: Locale,
  services: ClinicServiceInput[],
  clinicId: string,
): JsonLdNode[] {
  const catalogId = `${siteUrl}/#services`;
  const visible = services.filter((service) =>
    hasVisibleServiceTitle(
      pickLocalized(locale, service.title, service.title_ar),
    ),
  );
  const sorted = [...visible].sort((a, b) => a.sort_order - b.sort_order);

  const procedures: JsonLdNode[] = sorted.map((service) => {
    const id = `${siteUrl}/#service-${service.id}`;
    const name = pickLocalized(locale, service.title, service.title_ar);
    const description = pickLocalized(
      locale,
      service.description,
      service.description_ar,
    );
    return {
      "@type": "MedicalProcedure",
      "@id": id,
      name,
      description: description || undefined,
      provider: { "@id": clinicId },
      procedureType: service.kind === "laser" ? "Laser dentistry" : undefined,
    };
  });

  const catalog: JsonLdNode = {
    "@type": "OfferCatalog",
    "@id": catalogId,
    name: "Dental services",
    // schema.org's documented shape for hasOfferCatalog: each entry is an
    // Offer wrapping the procedure it offers, not a nested OfferCatalog.
    itemListElement: procedures.map((procedure) => ({
      "@type": "Offer",
      itemOffered: { "@id": procedure["@id"] as string },
    })),
  };

  return [catalog, ...procedures];
}

/** Site-wide graph: clinic, doctor, website, and the full services catalog. */
export function buildClinicGraph(input: BuildClinicGraphInput): JsonLdGraph {
  const { siteUrl, locale, settings, hours, services } = input;
  const clinicId = `${siteUrl}/#clinic`;
  const doctorId = `${siteUrl}/#dr-karim`;
  const safeSettings = settings ?? {};

  const servicesNodes = buildServicesGraph(siteUrl, locale, services, clinicId);
  const catalogId = servicesNodes[0]?.["@id"] as string;

  return {
    "@context": "https://schema.org",
    "@graph": [
      buildClinicNode(siteUrl, safeSettings, hours, catalogId, doctorId),
      buildDoctorNode(siteUrl, locale, safeSettings, clinicId),
      buildWebsiteNode(siteUrl, safeSettings, clinicId),
      ...servicesNodes,
    ],
  };
}
