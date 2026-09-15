import type { ServiceDoctorMapping } from "./queries";

export type PriceableService = {
  id: string;
  title: string;
  title_ar: string | null;
  price_label: string | null;
  /** The floor of the clinic's range, and the fallback a doctor fee resolves to. */
  price_min_egp?: number | null;
};

export type PriceableDoctor = { id: string; display_name: string | null };

/**
 * The display label for what a doctor charges — their own override if one is
 * set, else the clinic-wide default, else nothing on file.
 *
 * Note this is the *label* path, and it is deliberately two rungs: the SQL in
 * list_bookable_doctors_for_service gained a third (services.price_min_egp)
 * in 20260915140000_doctor_price_falls_back_to_min.sql. For prefilling an
 * amount use `resolveServiceDoctorPriceEgp`, which follows the SQL; this one
 * stays label-shaped for the pickers that show a range to staff.
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
 * What to bill for this doctor doing this service, in EGP.
 *
 * Mirrors the COALESCE in list_bookable_doctors_for_service as of
 * 20260915140000: the doctor's own fee, else the clinic's floor for that
 * service, else nothing. The floor is the right fallback because "EGP 300-600"
 * is not an answer to "what does this doctor charge" — a range cannot prefill
 * an amount field, which is why the label path gives up on one.
 *
 * `??` throughout, so a mapping row that exists with no price set falls
 * through to the floor rather than billing zero.
 */
export function resolveServiceDoctorPriceEgp(
  serviceId: string,
  doctorId: string | undefined,
  mappings: Record<string, ServiceDoctorMapping[]>,
  service: { price_min_egp?: number | null } | undefined,
): number | null {
  const own = doctorId
    ? (mappings[serviceId] ?? []).find((e) => e.doctorId === doctorId)
    : undefined;
  return own?.priceEgp ?? service?.price_min_egp ?? null;
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
