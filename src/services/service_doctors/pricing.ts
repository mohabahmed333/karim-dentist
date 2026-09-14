import type { ServiceDoctorMapping } from "./queries";

/**
 * What a doctor charges for a service — their own override if one is set,
 * else the clinic-wide default, else nothing on file. Mirrors the same
 * COALESCE the list_bookable_doctors_for_service RPC does in SQL, so a
 * client-side picker (the billing "Add charge" form) agrees with what the
 * WhatsApp assistant would quote for the same pair.
 */
export function resolveServiceDoctorPrice(
  serviceId: string,
  doctorId: string,
  mappings: Record<string, ServiceDoctorMapping[]>,
  clinicDefault: string | null,
): string | null {
  const own = (mappings[serviceId] ?? []).find((e) => e.doctorId === doctorId);
  return own?.priceLabel ?? clinicDefault ?? null;
}

/**
 * A single clean number pulled from a free-text price label, for prefilling
 * a numeric amount field — "EGP 800" or "From EGP 800" both resolve to
 * "800", but a range like "EGP 300-600" has two numbers and resolves to
 * nothing, since guessing which end to prefill would be worse than leaving
 * it blank for staff to type themselves.
 */
export function extractSingleAmount(label: string | null): string | null {
  if (!label) return null;
  const matches = label.match(/\d+(?:\.\d+)?/g);
  if (!matches || matches.length !== 1) return null;
  return matches[0];
}
