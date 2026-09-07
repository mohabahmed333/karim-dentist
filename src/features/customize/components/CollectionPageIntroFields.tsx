"use client";

import { useCustomize } from "../context/CustomizeContext";
import { useCustomizeRoute } from "../context/CustomizeRouteContext";
import type { CollectionSection } from "../types";
import type { SiteSettings } from "@/services/site_settings";
import { BilingualField } from "./BilingualField";
import { CollectionPreviewTabs } from "./CollectionPreviewTabs";
import { EditorFieldCard, EditorSectionHeader } from "./EditorSectionChrome";
import { EditorFieldShell } from "./EditorFieldShell";
import { useFocusEditorField } from "./useFocusEditorField";

type Props = { section: CollectionSection };

function viewHrefFor(section: CollectionSection, indexPreview: boolean) {
  if (section === "case-studies") {
    return indexPreview ? "/case-studies" : "/#case-studies";
  }
  if (section === "slider") {
    return indexPreview ? "/featured" : "/#featured";
  }
  if (section === "services") {
    return indexPreview ? "/services" : "/#services";
  }
  return "/";
}

type IntroConfig = {
  titleKey: "case_studies_title" | "featured_title" | "services_title";
  descKey?:
    | "case_studies_description"
    | "featured_description"
    | "services_description";
  title: string;
  titleAr: string;
  description?: string;
  descriptionAr?: string;
};

function introConfig(
  section: CollectionSection,
  settings: NonNullable<ReturnType<typeof useCustomize>["data"]["settings"]>,
): IntroConfig | null {
  if (section === "case-studies") {
    return {
      titleKey: "case_studies_title",
      descKey: "case_studies_description",
      title: settings.case_studies_title,
      titleAr: settings.case_studies_title_ar ?? "",
      description: settings.case_studies_description,
      descriptionAr: settings.case_studies_description_ar ?? "",
    };
  }
  if (section === "slider") {
    return {
      titleKey: "featured_title",
      descKey: "featured_description",
      title: settings.featured_title,
      titleAr: settings.featured_title_ar ?? "",
      description: settings.featured_description,
      descriptionAr: settings.featured_description_ar ?? "",
    };
  }
  if (section === "services") {
    return {
      titleKey: "services_title",
      title: settings.services_title,
      titleAr: settings.services_title_ar ?? "",
    };
  }
  return null;
}

export function CollectionPageIntroFields({ section }: Props) {
  const { data, patchSettings } = useCustomize();
  const { route, setIndexPreview } = useCustomizeRoute();
  const rootRef = useFocusEditorField(route.focusField, section);
  const settings = data.settings;
  if (!settings) return null;
  const config = introConfig(section, settings);
  if (!config) return null;

  const titleArKey = `${config.titleKey}_ar` as keyof SiteSettings;

  return (
    <section ref={rootRef} className="space-y-2.5 border-b border-[#e8e8e8] pb-3">
      <EditorSectionHeader title="Page intro" />
      <CollectionPreviewTabs
        indexPreview={route.indexPreview}
        onChange={setIndexPreview}
        viewHref={viewHrefFor(section, route.indexPreview)}
      />
      <EditorFieldCard>
        <EditorFieldShell field={config.titleKey}>
          <BilingualField
            label="Title"
            valueEn={config.title}
            valueAr={config.titleAr}
            onChangeEn={(value) =>
              patchSettings({ [config.titleKey]: value })
            }
            onChangeAr={(value) =>
              patchSettings({ [titleArKey]: value } as Partial<SiteSettings>)
            }
            idPrefix={config.titleKey}
          />
        </EditorFieldShell>
        {config.descKey ? (
          <EditorFieldShell field={config.descKey}>
            <BilingualField
              label="Description"
              valueEn={config.description ?? ""}
              valueAr={config.descriptionAr ?? ""}
              onChangeEn={(value) =>
                patchSettings({ [config.descKey!]: value })
              }
              onChangeAr={(value) =>
                patchSettings({
                  [`${config.descKey}_ar`]: value,
                } as Partial<SiteSettings>)
              }
              multiline
              idPrefix={config.descKey}
            />
          </EditorFieldShell>
        ) : null}
      </EditorFieldCard>
    </section>
  );
}
