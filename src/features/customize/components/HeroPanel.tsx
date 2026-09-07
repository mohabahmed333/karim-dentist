"use client";

import { useState } from "react";
import { HeroHeadlineImageField } from "@/features/admin/components/HeroHeadlineImageField";
import { useCustomize } from "../context/CustomizeContext";
import { useFocusEditorField } from "./useFocusEditorField";
import { BilingualField } from "./BilingualField";
import { ControlledField } from "./ControlledField";
import { EditorFieldCard, EditorSectionHeader } from "./EditorSectionChrome";
import { EditorFieldShell } from "./EditorFieldShell";
import { EditorOpenPageLink } from "./EditorOpenPageLink";
import { EditorPanelShell } from "./EditorPanelShell";
import { EditorSegmentTabs } from "./EditorSegmentTabs";
import { useTranslations } from "@/lib/i18n";
import { HeroMediaFields } from "./HeroMediaFields";

type Tab = "copy" | "media";

type Props = {
  focusField?: string | null;
};

export function HeroPanel({ focusField }: Props) {
  const t = useTranslations();
  const { data, patchHero } = useCustomize();
  const [tab, setTab] = useState<Tab>("copy");
  const rootRef = useFocusEditorField(focusField, "hero");
  const hero = data.hero;
  if (!hero) {
    return <p className="text-sm text-[#8a8a8a]">{t("admin.customize.noHero")}</p>;
  }

  return (
    <EditorPanelShell>
      <div ref={rootRef} className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex shrink-0 items-center justify-between gap-2">
          <EditorSectionHeader title={t("admin.pages.hero.title")} />
          <EditorOpenPageLink href="/#hero" />
        </div>
        <EditorSegmentTabs
          ariaLabel={t("admin.customize.heroEditor")}
          value={tab}
          options={[
            { id: "copy", label: t("admin.customize.copy") },
            { id: "media", label: t("admin.customize.media") },
          ]}
          onChange={setTab}
        />
        {tab === "copy" ? (
          <EditorFieldCard fill>
            <HeroHeadlineImageField
              value={hero.headline_image_url}
              onChange={(headline_image_url) => patchHero({ headline_image_url })}
            />
            <EditorFieldShell field="kicker">
              <BilingualField
                label={t("admin.customize.topLine")}
                valueEn={hero.kicker}
                valueAr={hero.kicker_ar ?? ""}
                onChangeEn={(kicker) => patchHero({ kicker })}
                onChangeAr={(kicker_ar) => patchHero({ kicker_ar })}
                idPrefix="kicker"
              />
            </EditorFieldShell>
            <EditorFieldShell field="headline">
              <BilingualField
                label={t("admin.customize.headline")}
                valueEn={hero.headline}
                valueAr={hero.headline_ar ?? ""}
                onChangeEn={(headline) => patchHero({ headline })}
                onChangeAr={(headline_ar) => patchHero({ headline_ar })}
                idPrefix="headline"
              />
            </EditorFieldShell>
            <EditorFieldShell field="accent">
              <BilingualField
                label={t("admin.customize.accent")}
                valueEn={hero.accent}
                valueAr={hero.accent_ar ?? ""}
                onChangeEn={(accent) => patchHero({ accent })}
                onChangeAr={(accent_ar) => patchHero({ accent_ar })}
                idPrefix="accent"
              />
            </EditorFieldShell>
            <EditorFieldShell field="body">
              <BilingualField
                label={t("admin.customize.description")}
                valueEn={hero.body}
                valueAr={hero.body_ar ?? ""}
                onChangeEn={(body) => patchHero({ body })}
                onChangeAr={(body_ar) => patchHero({ body_ar })}
                multiline
                idPrefix="body"
              />
            </EditorFieldShell>
            <EditorFieldShell field="cta_primary_label">
              <BilingualField
                label={t("admin.customize.buttonLabel")}
                valueEn={hero.cta_primary_label}
                valueAr={hero.cta_primary_label_ar ?? ""}
                onChangeEn={(cta_primary_label) =>
                  patchHero({ cta_primary_label })
                }
                onChangeAr={(cta_primary_label_ar) =>
                  patchHero({ cta_primary_label_ar })
                }
                idPrefix="cta-primary-label"
              />
            </EditorFieldShell>
            <EditorFieldShell field="cta_primary_href">
              <ControlledField
                label={t("admin.customize.buttonLink")}
                value={hero.cta_primary_href}
                onChange={(cta_primary_href) => patchHero({ cta_primary_href })}
              />
            </EditorFieldShell>
          </EditorFieldCard>
        ) : (
          <EditorFieldCard fill>
            <HeroMediaFields hero={hero} patchHero={patchHero} />
          </EditorFieldCard>
        )}
      </div>
    </EditorPanelShell>
  );
}
