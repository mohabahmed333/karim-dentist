import { hasVisibleServiceTitle } from "@/features/portfolio/lib/serviceKindGroups";

type ServiceInput = {
  id: string;
  title?: string | null;
  title_ar?: string | null;
  description?: string | null;
  description_ar?: string | null;
  kind?: string | null;
  sort_order: number;
  slug?: string | null;
};

type Bilingual = { en: string; ar: string };

export type PublicServicePayload = {
  id: string;
  name: Bilingual;
  description: Bilingual;
  kind: string;
  url: string | null;
};

function text(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function bilingual(en: string | null | undefined, ar: string | null | undefined): Bilingual {
  const enText = text(en);
  const arText = text(ar);
  return { en: enText, ar: arText || enText };
}

/** Pure builder for GET /api/v1/public/services. Excludes placeholder
 * titles ("Untitled") the same way the JSON-LD catalogue does — a service
 * that isn't real enough for structured data isn't real enough here. */
export function buildPublicServicesPayload(
  services: ServiceInput[],
  siteUrl: string,
): PublicServicePayload[] {
  return services
    .filter((service) => hasVisibleServiceTitle(text(service.title)))
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((service) => ({
      id: service.id,
      name: bilingual(service.title, service.title_ar),
      description: bilingual(service.description, service.description_ar),
      kind: text(service.kind) || "our_services",
      url: service.slug ? `${siteUrl}/services/${service.slug}` : null,
    }));
}
