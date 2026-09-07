"use client";

import { CalloutLeadImageField } from "@/features/admin/components/CalloutLeadImageField";
import { useCustomize } from "../context/CustomizeContext";
import { useCustomizeRoute } from "../context/CustomizeRouteContext";
import {
  joinCalloutBody,
  splitCalloutBody,
} from "@/features/portfolio/lib/calloutParts";
import { BilingualField } from "./BilingualField";
import { EditorFieldCard, EditorSectionHeader } from "./EditorSectionChrome";
import { EditorOpenPageLink } from "./EditorOpenPageLink";
import { EditorPanelShell } from "./EditorPanelShell";
import { useFocusEditorField } from "./useFocusEditorField";

export function CalloutPanel() {
  const { data, patchCallout } = useCustomize();
  const { route } = useCustomizeRoute();
  const callout = data.callout;
  const rootRef = useFocusEditorField(route.focusField, "callout");

  if (!callout) {
    return <p className="text-sm text-[#8a8a8a]">No callout row.</p>;
  }

  const { lead, accent } = splitCalloutBody(callout.body);
  const { lead: leadAr, accent: accentAr } = splitCalloutBody(
    callout.body_ar ?? "",
  );

  return (
    <EditorPanelShell>
      <div ref={rootRef} className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <EditorSectionHeader title="Callout" />
          <EditorOpenPageLink href="/#callout" />
        </div>
        <EditorFieldCard>
          <CalloutLeadImageField
            value={callout.lead_image_url}
            onChange={(lead_image_url) => patchCallout({ lead_image_url })}
          />
          <div data-editor-field="callout-lead">
            <BilingualField
              label="Big script text (fallback)"
              valueEn={lead}
              valueAr={leadAr}
              onChangeEn={(next) =>
                patchCallout({ body: joinCalloutBody(next, accent) })
              }
              onChangeAr={(next) =>
                patchCallout({ body_ar: joinCalloutBody(next, accentAr) })
              }
              multiline
              idPrefix="callout-lead"
            />
            <p className="mt-1 text-[10px] leading-relaxed text-[#8a8a8a]">
              One line per script row, or leave as one line to auto-wrap.
            </p>
          </div>
          <div data-editor-field="callout-accent">
            <BilingualField
              label="Overlay text"
              valueEn={accent}
              valueAr={accentAr}
              onChangeEn={(next) =>
                patchCallout({ body: joinCalloutBody(lead, next) })
              }
              onChangeAr={(next) =>
                patchCallout({ body_ar: joinCalloutBody(leadAr, next) })
              }
              multiline
              idPrefix="callout-accent"
            />
            <p className="mt-1 text-[10px] leading-relaxed text-[#8a8a8a]">
              Smaller white line that sits over the script.
            </p>
          </div>
        </EditorFieldCard>
      </div>
    </EditorPanelShell>
  );
}
