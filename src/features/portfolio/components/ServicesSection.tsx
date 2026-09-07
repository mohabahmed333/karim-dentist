"use client";

import type { Tables } from "@/lib/supabase/database.types";
import { pickLocalized, useLocale, useTranslations } from "@/lib/i18n";
import {
  groupServicesByKind,
  hasVisibleServiceTitle,
} from "@/features/portfolio/lib/serviceKindGroups";
import { MediaFigure } from "./MediaFigure";
import { SectionHeading } from "./SectionHeading";

type Service = Tables<"services">;

type Props = {
  items: Service[];
  title: string;
  previewMode?: boolean;
};

function indexLabel(order: number, index: number) {
  const n = order > 0 ? order : index + 1;
  return String(n).padStart(2, "0");
}

function ServiceRows({
  items,
  previewMode,
}: {
  items: Service[];
  previewMode?: boolean;
}) {
  const { locale } = useLocale();
  return (
    <ul className="services-list">
      {items.map((item, index) => {
        const title = pickLocalized(locale, item.title, item.title_ar);
        const description = pickLocalized(
          locale,
          item.description,
          item.description_ar,
        );
        return (
          <li
            key={item.id}
            id={`customize-item-${item.id}`}
            className="services-row"
            data-customize-item={item.id}
            data-services-row=""
          >
            <span className="services-index" aria-hidden>
              {indexLabel(item.sort_order, index)}
            </span>
            <h3 className="services-name" data-customize-field="title">
              {title}
            </h3>
            <ul className="services-tags" data-customize-field="tags">
              {(item.tags ?? []).map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
            <p className="services-desc" data-customize-field="description">
              {description}
            </p>
            <div className="services-media" data-customize-field="image_url">
              {item.image_url ? (
                <MediaFigure
                  src={item.image_url}
                  mediaType={item.media_type}
                  alt={title}
                  previewMode={previewMode}
                />
              ) : (
                <div className="services-media-ph" />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function ServicesSection({ items, title, previewMode }: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  if (!items.length) return null;

  const visible = items.filter((item) =>
    hasVisibleServiceTitle(pickLocalized(locale, item.title, item.title_ar)),
  );

  const groups = groupServicesByKind(visible, {
    our_services: t("serviceKindOurServices"),
    laser: t("serviceKindLaser"),
  }).filter((group) => group.items.length > 0);

  return (
    <section
      className="services-section"
      id="services"
      data-customize-section="services"
    >
      <SectionHeading className="section-header--flush">
        <span data-customize-field="services_title">{title}</span>
      </SectionHeading>
      {groups.map((group) => (
        <div key={group.kind}>
          <h3 className="mb-4 mt-8 text-xl font-semibold text-[#0f2744]">
            {group.title}
          </h3>
          <ServiceRows items={group.items} previewMode={previewMode} />
        </div>
      ))}
    </section>
  );
}
