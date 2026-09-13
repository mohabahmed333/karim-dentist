"use client";

import { MapPin, Phone } from "lucide-react";
import type { SupportMessage } from "../supportDummyData";

type Props = {
  flow: NonNullable<SupportMessage["flow"]>;
};

export function InteractiveOutboundCard({ flow }: Props) {
  if (flow.kind === "location") {
    return (
      <div className="mb-2 rounded-lg border border-[var(--wa-surface-border)] bg-[var(--wa-surface-bg)] px-3 py-2 text-sm">
        <p className="flex items-center gap-1.5 font-medium text-[var(--wa-surface-text)]">
          <MapPin className="h-3.5 w-3.5 text-[#EF4444]" />
          {flow.title ?? "Location"}
        </p>
        {flow.address ? (
          <p className="mt-1 text-xs text-[var(--wa-surface-muted-text)]">{flow.address}</p>
        ) : null}
      </div>
    );
  }

  if (flow.kind === "contacts") {
    return (
      <div className="mb-2 rounded-lg border border-[var(--wa-surface-border)] bg-[var(--wa-surface-bg)] px-3 py-2 text-sm">
        <p className="font-medium text-[var(--wa-surface-text)]">{flow.title ?? "Contact"}</p>
        {flow.phone ? (
          <p className="mt-1 flex items-center gap-1 text-xs text-[var(--wa-surface-muted-text)]">
            <Phone className="h-3 w-3" />
            {flow.phone}
          </p>
        ) : null}
        {flow.address ? (
          <p className="mt-0.5 text-xs text-[var(--wa-surface-muted-text)]">{flow.address}</p>
        ) : null}
      </div>
    );
  }

  if (flow.kind === "buttons" && flow.buttons?.length) {
    return (
      <div className="mb-2 space-y-1.5">
        <div className="flex flex-wrap gap-1.5">
          {flow.buttons.map((b) => (
            <span
              key={b.id}
              className="rounded-full border border-[var(--wa-surface-border)] bg-[var(--wa-surface-bg)] px-2.5 py-1 text-xs font-medium text-[var(--wa-surface-text)]"
            >
              {b.title}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (flow.kind === "cta" && flow.ctaUrl) {
    return (
      <div className="mb-2">
        <a
          href={flow.ctaUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex rounded-full border border-[var(--wa-surface-border)] bg-[var(--wa-surface-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--wa-accent)] hover:bg-[var(--wa-surface-hover)]"
        >
          {flow.ctaLabel ?? flow.cta ?? "Open link"}
        </a>
      </div>
    );
  }

  return null;
}
