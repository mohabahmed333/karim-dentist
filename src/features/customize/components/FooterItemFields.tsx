"use client";

import { BilingualField } from "./BilingualField";
import { ControlledField } from "./ControlledField";
import { SelectField } from "./SelectField";
import { FooterIconUploadField } from "./FooterIconUploadField";
import { FOOTER_ICON_PRESETS } from "@/features/portfolio/lib/footerIcons";

type Props = {
  item: Record<string, unknown> & { id: string };
  onPatch: (partial: Record<string, unknown>) => void;
};

const DISPLAY_OPTIONS = [
  { value: "text", label: "Text" },
  { value: "icon", label: "Icon" },
] as const;

const COLUMN_OPTIONS = [
  { value: "portfolio", label: "Links" },
  { value: "follow", label: "Follow Us" },
] as const;

const PRESET_OPTIONS = [
  { value: "none", label: "None" },
  ...FOOTER_ICON_PRESETS.map((p) => ({ value: p.value, label: p.label })),
];

export function FooterItemFields({ item, onPatch }: Props) {
  const displayMode = String(item.display_mode ?? "text");

  return (
    <>
      <BilingualField
        label="Label"
        valueEn={String(item.label ?? "")}
        valueAr={String(item.label_ar ?? "")}
        onChangeEn={(label) => onPatch({ label })}
        onChangeAr={(label_ar) => onPatch({ label_ar })}
        idPrefix={`footer-label-${item.id}`}
      />
      <ControlledField
        label="Href"
        value={String(item.href ?? "")}
        onChange={(href) => onPatch({ href })}
      />
      <SelectField
        label="Column"
        value={String(item.column_key ?? "portfolio")}
        options={COLUMN_OPTIONS}
        onChange={(column_key) => onPatch({ column_key })}
      />
      <SelectField
        label="Display"
        value={displayMode === "icon" ? "icon" : "text"}
        options={DISPLAY_OPTIONS}
        onChange={(display_mode) => onPatch({ display_mode })}
      />
      {displayMode === "icon" ? (
        <>
          <SelectField
            label="Preset icon"
            value={String(item.icon_key ?? "none") || "none"}
            options={PRESET_OPTIONS}
            onChange={(next) =>
              onPatch({ icon_key: next === "none" ? null : next })
            }
          />
          <FooterIconUploadField
            value={typeof item.icon_url === "string" ? item.icon_url : ""}
            onChange={(icon_url) => onPatch({ icon_url: icon_url || null })}
          />
        </>
      ) : null}
    </>
  );
}
