import type { Reservation } from "@/services/reservations/types";
import type { Service } from "@/services/services/types";
import { RESERVATION_FIXTURES } from "./fixtures/reservationFixtures";

export function buildShowreelReservations(): Reservation[] {
  const now = new Date().toISOString();
  return RESERVATION_FIXTURES.map((row) => ({
    id: row.id,
    patient_name: row.patientName,
    phone: row.phone,
    email: null,
    service_id: null,
    service_label: row.serviceLabel,
    starts_at: row.startsAt,
    notes: "[demo-showreel]",
    status: row.status,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  }));
}

export function buildShowreelServices(): Service[] {
  const now = new Date().toISOString();
  const rows: Array<{
    id: string;
    title: string;
    title_ar: string;
    sort_order: number;
  }> = [
    {
      id: "svc-whitening",
      title: "Teeth whitening",
      title_ar: "تبييض الأسنان",
      sort_order: 0,
    },
    {
      id: "svc-consult",
      title: "General consultation",
      title_ar: "كشف عام",
      sort_order: 1,
    },
    {
      id: "svc-cleaning",
      title: "Cleaning",
      title_ar: "تنظيف",
      sort_order: 2,
    },
  ];
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    title_ar: row.title_ar,
    description: row.title,
    description_ar: row.title_ar,
    slug: row.id.replace(/^svc-/, ""),
    kind: "our_services",
    tags: [],
    image_url: null,
    media_type: "image",
    sort_order: row.sort_order,
    is_published: true,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  }));
}
