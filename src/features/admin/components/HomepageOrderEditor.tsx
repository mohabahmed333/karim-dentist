"use client";

import { useTranslations } from "@/lib/i18n";
import { useState } from "react";
import { toast } from "sonner";
import { upsertSettings, type SiteSettings } from "@/services/site_settings";
import {
  DEFAULT_HOMEPAGE_SECTION_ORDER,
  moveHomepageSection,
  normalizeHomepageSectionOrder,
  toggleHomepageSectionHidden,
  type HideableSectionKey,
} from "@/features/portfolio/lib/homepageSectionOrder";
import { HomepageSectionOrderList } from "@/features/portfolio/components/HomepageSectionOrderList";
import { useSortableListDrag } from "@/features/customize/components/useSortableListDrag";
import { SortableDragGhostLayer } from "@/features/customize/components/SortableDragGhostLayer";
import { LocalizedAdminPageHeader } from "./LocalizedAdminPageHeader";
import { HomepageSectionTitlesFields } from "./HomepageSectionTitlesFields";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Props = { settings: SiteSettings | null };

function titleSnapshot(settings: SiteSettings | null) {
  if (!settings) return "";
  return JSON.stringify({
    about_title: settings.about_title,
    gallery_title: settings.gallery_title,
    gallery_heading: settings.gallery_heading,
    gallery_description: settings.gallery_description,
    solutions_title: settings.solutions_title,
    solutions_description: settings.solutions_description,
    services_title: settings.services_title,
    services_heading: settings.services_heading,
    services_description: settings.services_description,
    slider_heading: settings.slider_heading,
    featured_title: settings.featured_title,
    featured_description: settings.featured_description,
    contact_title: settings.contact_title,
    contact_headline: settings.contact_headline,
  });
}

export function HomepageOrderEditor({ settings: initial }: Props) {
  const t = useTranslations();
  const [settings, setSettings] = useState(initial);
  const [order, setOrder] = useState(() =>
    normalizeHomepageSectionOrder(
      initial?.homepage_section_order ?? DEFAULT_HOMEPAGE_SECTION_ORDER,
    ),
  );
  const [hidden, setHidden] = useState<string[]>(
    () => initial?.homepage_hidden_sections ?? [],
  );
  const [savedKey, setSavedKey] = useState(() =>
    JSON.stringify({
      order: normalizeHomepageSectionOrder(initial?.homepage_section_order),
      hidden: initial?.homepage_hidden_sections ?? [],
      titles: titleSnapshot(initial),
    }),
  );
  const [pending, setPending] = useState(false);

  const dirty =
    JSON.stringify({
      order,
      hidden,
      titles: titleSnapshot(settings),
    }) !== savedKey;

  const drag = useSortableListDrag((from, to) => {
    setOrder((current) => moveHomepageSection(current, from, to));
  });

  function onToggleHidden(key: HideableSectionKey) {
    setHidden((current) => toggleHomepageSectionHidden(current, key));
  }

  async function onSave() {
    if (!settings) return;
    setPending(true);
    try {
      const row = await upsertSettings(settings, {
        homepage_section_order: order,
        homepage_hidden_sections: hidden,
        about_title: settings.about_title,
        gallery_title: settings.gallery_title,
        gallery_heading: settings.gallery_heading,
        gallery_description: settings.gallery_description,
        solutions_title: settings.solutions_title,
        solutions_description: settings.solutions_description,
        services_title: settings.services_title,
        services_heading: settings.services_heading,
        services_description: settings.services_description,
        slider_heading: settings.slider_heading,
        featured_title: settings.featured_title,
        featured_description: settings.featured_description,
        contact_title: settings.contact_title,
        contact_headline: settings.contact_headline,
      });
      setSettings(row);
      setOrder(normalizeHomepageSectionOrder(row.homepage_section_order));
      setHidden(row.homepage_hidden_sections ?? []);
      setSavedKey(
        JSON.stringify({
          order: normalizeHomepageSectionOrder(row.homepage_section_order),
          hidden: row.homepage_hidden_sections ?? [],
          titles: titleSnapshot(row),
        }),
      );
      toast.success(t("admin.pages.homepage.saved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.saveFailed"));
    } finally {
      setPending(false);
    }
  }

  if (!settings) {
    return <p className="text-sm text-muted-foreground">No site settings row.</p>;
  }

  return (
    <>
      <LocalizedAdminPageHeader
        titleKey="admin.pages.homepage.title"
        descriptionKey="admin.pages.homepage.description"
      />
      <div className="grid max-w-3xl gap-6">
        <Card className="gap-4 p-6">
          <h2 className="text-sm font-semibold">Order & visibility</h2>
          <p className="text-sm text-muted-foreground">
            Hero always stays first. Drag sections below it, then hide any you do not need.
          </p>
          <HomepageSectionOrderList
            order={order}
            hidden={hidden}
            onToggleHidden={onToggleHidden}
            getHandleProps={drag.getHandleProps}
            getItemProps={drag.getItemProps}
            overIndex={drag.overIndex}
            draggingIndex={drag.draggingIndex}
            tone="admin"
          />
        </Card>
        <Card className="gap-4 p-6">
          <h2 className="text-sm font-semibold">Section titles</h2>
          <HomepageSectionTitlesFields
            settings={settings}
            onChange={(patch) => setSettings((current) => (current ? { ...current, ...patch } : current))}
          />
        </Card>
        <Button type="button" disabled={pending || !dirty} onClick={() => void onSave()}>
          {pending ? t("admin.saving") : t("admin.save")}
        </Button>
      </div>
      <SortableDragGhostLayer ghost={drag.dragGhost} />
    </>
  );
}
