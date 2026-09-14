import type { ServiceDoctorMapping } from "./queries";

export type PriceableService = {
  id: string;
  title: string;
  title_ar: string | null;
  price_label: string | null;
};

export type PriceableDoctor = { id: string; display_name: string | null };

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

/**
 * The one place services.price_label / service_doctors.price_label are ever
 * generated, from the real, structured price fields — null when both are
 * null (nothing on file), "EGP {min}" when they're equal (one clean
 * figure), else "EGP {min}-{max}" (a real range). Every existing reader of
 * price_label (the WhatsApp prompt, the public site, billing price-lookup)
 * keeps working unchanged, since this is just what now writes that column.
 */
export function formatPriceRangeLabel(
  min: number | null,
  max: number | null,
): string | null {
  if (min == null && max == null) return null;
  if (min == null) return `EGP ${max}`;
  if (max == null) return `EGP ${min}`;
  return min === max ? `EGP ${min}` : `EGP ${min}-${max}`;
}

/**
 * Whether a doctor's own price stays within the clinic's published band for
 * that service — the clinic sets the floor and ceiling, and a doctor's
 * actual price has to land somewhere inside it, not undercut the floor or
 * exceed the ceiling. Both sides are now real numbers (price_min_egp/
 * price_max_egp on the service, price_egp on the doctor's override), so
 * this is an exact comparison, not a guess parsed out of free text.
 *
 * Fails open: a blank doctor price (no override at all), or a clinic
 * bound that isn't set, means there is nothing to check — never block a
 * save over a comparison that cannot honestly be made.
 */
export function isPriceEgpWithinRange(
  doctorPriceEgp: number | null,
  min: number | null,
  max: number | null,
): boolean {
  if (doctorPriceEgp == null) return true;
  if (min != null && doctorPriceEgp < min) return false;
  if (max != null && doctorPriceEgp > max) return false;
  return true;
}
