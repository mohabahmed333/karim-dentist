import type { Tables } from "@/lib/supabase/database.types";
import {
  calloutAccentLabel,
  calloutScriptLines,
  splitCalloutBody,
} from "../lib/calloutParts";

type Props = {
  callout: Tables<"callouts">;
};

export function CalloutSection({ callout }: Props) {
  const { lead, accent } = splitCalloutBody(callout.body);
  const lines = calloutScriptLines(lead);
  const accentText = accent ? calloutAccentLabel(accent) : null;
  const leadImage = callout.lead_image_url?.trim() || null;
  const leadAlt = lead.trim() || "Callout statement";

  return (
    <section
      className="callout"
      id="callout"
      data-customize-section="callout"
      aria-label="Statement"
    >
      <div className="callout-stack">
        <div className="callout-stage">
          <p
            className="callout-lead"
            data-customize-field="callout-lead"
            aria-hidden={Boolean(accentText && (leadImage || lines.some(Boolean)))}
          >
            {leadImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="callout-lead-image"
                src={leadImage}
                alt={leadAlt}
              />
            ) : (
              lines.map((line) => (
                <span key={line} className="callout-line">
                  {line}
                </span>
              ))
            )}
          </p>
          {accentText ? (
            <p className="callout-accent" data-customize-field="callout-accent">
              <span>{accentText}</span>
            </p>
          ) : null}
        </div>
        {accentText ? (
          <span className="sr-only">
            {lead} {accentText}
          </span>
        ) : null}
      </div>
    </section>
  );
}
