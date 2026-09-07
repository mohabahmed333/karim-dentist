"use client";

import { useCustomize } from "../context/CustomizeContext";
import { useFocusEditorField } from "./useFocusEditorField";
import { BilingualField } from "./BilingualField";
import { DentalSectionCopyFields } from "./DentalSectionCopyFields";
import { EditorFieldCard, EditorSectionHeader } from "./EditorSectionChrome";
import { EditorFieldShell } from "./EditorFieldShell";
import { EditorOpenPageLink } from "./EditorOpenPageLink";
import { EditorPanelShell } from "./EditorPanelShell";
import { SettingsContactCustomizeFields } from "./SettingsContactCustomizeFields";
import { ContactCardCustomizeFields } from "./ContactCardCustomizeFields";

type Props = {
  focusField?: string | null;
};

export function ContactPanel({ focusField }: Props) {
  const { data, patchSettings } = useCustomize();
  const rootRef = useFocusEditorField(focusField, "contact");
  const settings = data.settings;
  if (!settings) {
    return <p className="text-sm text-[#8a8a8a]">No settings row.</p>;
  }

  return (
    <EditorPanelShell>
      <div className="flex items-center justify-between gap-2">
        <EditorSectionHeader title="Contact" />
        <EditorOpenPageLink href="/#contact" />
      </div>
      <div ref={rootRef} className="space-y-3">
        <EditorFieldCard>
          <DentalSectionCopyFields
            section="contact"
            settings={settings}
            patchSettings={patchSettings}
          />
        </EditorFieldCard>
        <ContactCardCustomizeFields
          settings={settings}
          patchSettings={patchSettings}
        />
        <SettingsContactCustomizeFields
          settings={settings}
          patchSettings={patchSettings}
        />
        <EditorFieldShell field="contact_blurb">
          <BilingualField
            label="Section blurb"
            valueEn={settings.contact_blurb}
            valueAr={settings.contact_blurb_ar ?? ""}
            onChangeEn={(contact_blurb) => patchSettings({ contact_blurb })}
            onChangeAr={(contact_blurb_ar) =>
              patchSettings({ contact_blurb_ar })
            }
            multiline
            idPrefix="contact-blurb"
          />
        </EditorFieldShell>
      </div>
    </EditorPanelShell>
  );
}
