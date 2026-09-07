"use client";

import { FooterTaglineImageField } from "@/features/admin/components/FooterTaglineImageField";
import { useCustomize } from "../context/CustomizeContext";
import { BilingualField } from "./BilingualField";

type Props = {
  focusField?: string | null;
};

export function FooterKeywordField({ focusField }: Props) {
  const { data, patchSettings } = useCustomize();
  const settings = data.settings;
  if (!settings) return null;

  const focused = focusField === "footer-tagline";

  return (
    <div
      className={
        focused
          ? "space-y-3 rounded-[4px] ring-2 ring-foreground/20"
          : "space-y-3"
      }
      data-editor-field="footer-tagline"
    >
      <FooterTaglineImageField
        value={settings.footer_tagline_image_url}
        onChange={(footer_tagline_image_url) =>
          patchSettings({ footer_tagline_image_url })
        }
      />
      <BilingualField
        label="Left keyword (text fallback)"
        valueEn={settings.footer_tagline}
        valueAr={settings.footer_tagline_ar ?? ""}
        onChangeEn={(footer_tagline) => patchSettings({ footer_tagline })}
        onChangeAr={(footer_tagline_ar) =>
          patchSettings({ footer_tagline_ar })
        }
        multiline
        idPrefix="footer-keyword"
      />
      <p className="text-[10px] leading-relaxed text-muted-foreground">
        One line per script row. Single-line text auto-wraps in the footer.
      </p>
    </div>
  );
}
