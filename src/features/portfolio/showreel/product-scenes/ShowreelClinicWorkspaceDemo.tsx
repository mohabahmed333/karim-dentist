"use client";

import { useEffect, useState } from "react";
import { Odontogram } from "@/features/admin/components/patients/Odontogram";
import {
  SHOWREEL_WHATSAPP_EVENT,
  type ShowreelWhatsappDetail,
} from "./showreelAdminEvents";
import {
  BOOKING_SLOT_FIXTURES,
  RESERVATION_FIXTURES,
} from "./fixtures/reservationFixtures";

/** Offline clinical workspace surface for WhatsApp → Workspace showreel. */
export function ShowreelClinicWorkspaceDemo() {
  const patient = RESERVATION_FIXTURES[0]!;
  const slot = BOOKING_SLOT_FIXTURES[0]!;
  const [selectedFdi, setSelectedFdi] = useState<string | null>("11");
  const [hoveredFdi, setHoveredFdi] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    function onShowreel(event: Event) {
      const detail = (event as CustomEvent<ShowreelWhatsappDetail>).detail;
      if (detail?.type === "confirm-book") setBooked(true);
    }
    window.addEventListener(SHOWREEL_WHATSAPP_EVENT, onShowreel);
    return () => window.removeEventListener(SHOWREEL_WHATSAPP_EVENT, onShowreel);
  }, []);

  return (
    <div
      data-showreel-action="clinic-workspace-page"
      className="relative min-h-[min(78vh,720px)] overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)]"
    >
      <header className="absolute start-4 top-4 z-10 md:start-6 md:top-5">
        <p className="text-sm font-semibold text-[var(--admin-text)]">
          {patient.patientName}
        </p>
        <p className="text-[11px] tracking-wide text-[var(--admin-muted)] uppercase">
          Clinical workspace
        </p>
      </header>
      <div className="grid h-full gap-4 p-4 pt-14 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-[var(--admin-border)] bg-white p-3">
          <Odontogram
            selectedFdi={selectedFdi}
            hoveredFdi={hoveredFdi}
            commented={new Set(["11", "16"])}
            onSelect={setSelectedFdi}
            onHover={setHoveredFdi}
            onDeselect={() => setSelectedFdi(null)}
          />
        </div>
        <section
          data-showreel-action="clinic-visit-context"
          className="space-y-3 rounded-xl border border-[var(--admin-border)] bg-white p-4"
        >
          <p className="text-[12px] font-semibold">Visit context</p>
          <p className="text-[13px] text-[var(--admin-muted)]">
            {patient.serviceLabel} · {patient.phone}
          </p>
          {booked ? (
            <div
              data-showreel-action="clinic-reservation-done"
              className="rounded-lg bg-[color-mix(in_srgb,var(--admin-primary)_12%,white)] px-3 py-2 text-[12px] font-medium text-[var(--admin-primary)]"
            >
              Reserved · {slot.label} · {patient.serviceLabel}
            </div>
          ) : (
            <ul className="space-y-1 text-[12px] text-[var(--admin-text)]">
              <li>· Whitening consult from WhatsApp</li>
              <li>· Preferred slot {slot.label}</li>
              <li>· Chart ready for clinical notes</li>
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
