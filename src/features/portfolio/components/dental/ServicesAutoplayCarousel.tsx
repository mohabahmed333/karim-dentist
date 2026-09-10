"use client";

import type { Tables } from "@/lib/supabase/database.types";
import { pickLocalized, useLocale, useTranslations } from "@/lib/i18n";
import {
  groupServicesByKind,
  hasVisibleServiceTitle,
} from "@/features/portfolio/lib/serviceKindGroups";
import { HorizontalCarousel } from "../HorizontalCarousel";
import { repeatForInfiniteLoop } from "../../lib/carouselAutoplay";

type Service = Tables<"services">;

function ServiceCard({
  service,
  duplicate = false,
}: {
  service: Service;
  /**
   * Embla needs repeated slides for a seamless loop, but the clones are the
   * same copy again. Hide them from assistive tech and from crawlers so the
   * page does not carry the same service title a dozen times.
   */
  duplicate?: boolean;
}) {
  const { locale } = useLocale();
  const title = pickLocalized(locale, service.title, service.title_ar);
  const description = pickLocalized(
    locale,
    service.description,
    service.description_ar,
  );

  return (
    <article
      className="services-carousel-card"
      data-carousel-card
      data-customize-item={service.id}
      aria-hidden={duplicate || undefined}
      data-nosnippet={duplicate || undefined}
    >
      {/* Real card contributes a heading; clones use inert markup. */}
      {duplicate ? (
        <p className="text-lg font-semibold text-[#0f2744]">{title}</p>
      ) : (
        <h4
          className="text-lg font-semibold text-[#0f2744]"
          data-customize-field="title"
        >
          {title}
        </h4>
      )}
      <p
        className="mt-2 text-sm leading-relaxed text-[#6b7280]"
        data-customize-field={duplicate ? undefined : "description"}
      >
        {description}
      </p>
    </article>
  );
}

export function ServicesAutoplayCarousel({
  services,
}: {
  services: Service[];
}) {
  const t = useTranslations();
  const { locale } = useLocale();
  if (!services.length) return null;

  const visible = services.filter((service) =>
    hasVisibleServiceTitle(
      pickLocalized(locale, service.title, service.title_ar),
    ),
  );

  const groups = groupServicesByKind(visible, {
    our_services: t("serviceKindOurServices"),
    laser: t("serviceKindLaser"),
  }).filter((group) => group.items.length > 0);

  return (
    <div className="mt-10 space-y-12">
      {groups.map((group) => {
        const loop = repeatForInfiniteLoop(group.items, 12);
        return (
          <div key={group.kind}>
            <h3 className="mb-4 text-xl font-semibold text-[#0f2744]">
              {group.title}
            </h3>
            <HorizontalCarousel
              className="services-carousel"
              label={group.title}
              autoplay
              autoplayDelayMs={3200}
              itemCount={loop.length}
            >
              {loop.map((service, index) => (
                <ServiceCard
                  key={`${service.id}-${index}`}
                  service={service}
                  duplicate={index >= group.items.length}
                />
              ))}
            </HorizontalCarousel>
          </div>
        );
      })}
    </div>
  );
}
