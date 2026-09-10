/**
 * Plain-text clinic summaries for AI agents, per the llms.txt convention
 * (llmstxt.org). Kept as pure string builders — the route handlers own
 * fetching data and HTTP concerns.
 */
import { isSitePageSectionVisible } from "@/features/portfolio/lib/homepageSectionNav";
import { hasVisibleServiceTitle } from "@/features/portfolio/lib/serviceKindGroups";
import { telHref, whatsappHref } from "@/features/portfolio/lib/contactInfo";
import {
  formatOpeningHoursText,
  type ClinicHoursInput,
} from "./openingHours";

type SettingsInput = {
  brand_name?: string | null;
  contact_clinic_name?: string | null;
  contact_doctor_name?: string | null;
  contact_credentials?: string | null;
  contact_headline?: string | null;
  contact_blurb?: string | null;
  contact_address?: string | null;
  contact_city?: string | null;
  contact_country?: string | null;
  contact_phone?: string | null;
  contact_whatsapp?: string | null;
  contact_email?: string | null;
  case_studies_title?: string | null;
  featured_title?: string | null;
  homepage_hidden_sections?: string[] | null;
};

type ServiceInput = {
  id: string;
  title?: string | null;
  description?: string | null;
  kind?: string | null;
  sort_order: number;
  slug?: string | null;
};

type CaseStudyInput = {
  slug: string | null;
  title?: string | null;
  description?: string | null;
  is_published: boolean;
};

function text(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function clinicName(settings: SettingsInput): string {
  return text(settings.contact_clinic_name) || text(settings.brand_name) || "The Dental Lounge";
}

function locationLine(settings: SettingsInput): string {
  const parts = [
    text(settings.contact_address),
    [text(settings.contact_city), text(settings.contact_country)]
      .filter(Boolean)
      .join(", "),
  ].filter(Boolean);
  return parts.join(" — ");
}

function publishedServices(services: ServiceInput[]): ServiceInput[] {
  return services
    .filter((service) => hasVisibleServiceTitle(text(service.title)))
    .sort((a, b) => a.sort_order - b.sort_order);
}

type IndexInput = {
  siteUrl: string;
  settings: SettingsInput | null;
  hours: ClinicHoursInput;
  services: ServiceInput[];
};

/** llms.txt — a short index per llmstxt.org: identity, NAP, hours, key pages,
 * and pointers to the full dump and the sitemap. */
export function buildLlmsIndex(input: IndexInput): string {
  const settings = input.settings ?? {};
  const name = clinicName(settings);
  const hours = formatOpeningHoursText(input.hours);
  const services = publishedServices(input.services);
  const hidden = settings.homepage_hidden_sections ?? [];

  const lines: string[] = [];
  lines.push(`# ${name}`);
  const blurb = text(settings.contact_blurb);
  if (blurb) lines.push(`> ${blurb}`);
  lines.push("");
  lines.push(`- Address: ${locationLine(settings) || "New Cairo, Egypt"}`);
  const phone = text(settings.contact_phone);
  if (phone) lines.push(`- Phone: ${phone} (${telHref(phone)})`);
  const whatsapp = whatsappHref(text(settings.contact_whatsapp));
  if (whatsapp) lines.push(`- WhatsApp: ${whatsapp}`);
  const email = text(settings.contact_email);
  if (email) lines.push(`- Email: ${email}`);
  if (hours) lines.push(`- Hours: ${hours}`);
  const doctor = text(settings.contact_doctor_name);
  if (doctor) lines.push(`- Lead dentist: ${doctor}`);
  lines.push(
    `- Languages: [English](${input.siteUrl}/), [Arabic (العربية)](${input.siteUrl}/ar)`,
  );

  lines.push("");
  lines.push("## Pages");
  lines.push(`- [Home](${input.siteUrl}/) — clinic overview, services, and booking`);
  if (isSitePageSectionVisible("case-studies", hidden)) {
    lines.push(
      `- [${text(settings.case_studies_title) || "Case studies"}](${input.siteUrl}/case-studies)`,
    );
  }
  if (isSitePageSectionVisible("featured", hidden)) {
    lines.push(
      `- [${text(settings.featured_title) || "Projects"}](${input.siteUrl}/featured)`,
    );
  }

  if (services.length > 0) {
    lines.push("");
    lines.push("## Services");
    for (const service of services) {
      const name = text(service.title);
      lines.push(
        service.slug
          ? `- [${name}](${input.siteUrl}/services/${service.slug})`
          : `- ${name}`,
      );
    }
  }

  lines.push("");
  lines.push("## Booking");
  lines.push(
    `To book an appointment, contact the clinic directly by WhatsApp or phone (above). This site does not offer an automated booking endpoint to external agents.`,
  );

  lines.push("");
  lines.push("## Machine-readable");
  lines.push(`- [Full details](${input.siteUrl}/llms-full.txt)`);
  lines.push(`- [Sitemap](${input.siteUrl}/sitemap.xml)`);
  lines.push(`- [Robots policy](${input.siteUrl}/robots.txt)`);

  return lines.join("\n");
}

type FullInput = IndexInput & {
  aboutBody?: string | null;
  caseStudies: CaseStudyInput[];
};

/** llms-full.txt — the index plus full service descriptions, about copy, and
 * every published case study. */
export function buildLlmsFull(input: FullInput): string {
  const services = publishedServices(input.services);
  const caseStudies = input.caseStudies.filter(
    (study) => study.is_published && text(study.slug),
  );

  const lines: string[] = [buildLlmsIndex(input), ""];

  const about = text(input.aboutBody);
  if (about) {
    lines.push("---", "", "## About", "", about);
  }

  if (services.length > 0) {
    lines.push("", "---", "", "## Services in detail");
    for (const service of services) {
      const description = text(service.description);
      lines.push("", `### ${text(service.title)}`);
      if (service.slug) lines.push(`${input.siteUrl}/services/${service.slug}`);
      if (description) lines.push(description);
    }
  }

  if (caseStudies.length > 0) {
    lines.push("", "---", "", "## Case studies");
    for (const study of caseStudies) {
      const title = text(study.title);
      const description = text(study.description);
      lines.push("", `### ${title}`);
      lines.push(`${input.siteUrl}/case-studies/${study.slug}`);
      if (description) lines.push(description);
    }
  }

  return lines.join("\n");
}
