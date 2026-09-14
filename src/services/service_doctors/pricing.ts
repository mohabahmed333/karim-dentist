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
 * The band a clinic price label actually allows — "EGP 300-600" is
 * [300, 600]; a single figure like "EGP 800" or "From EGP 800" is [800, 800]
 * (nothing to range over, so floor and ceiling are the same number). Null
 * when the label has no numbers, or more than two — nothing reliable to
 * bound a doctor's own price against.
 */
export function extractPriceRange(
  label: string | null,
): { min: number; max: number } | null {
  if (!label) return null;
  const matches = label.match(/\d+(?:\.\d+)?/g);
  if (!matches || matches.length === 0 || matches.length > 2) return null;
  const numbers = matches.map(Number).sort((a, b) => a - b);
  return { min: numbers[0], max: numbers[numbers.length - 1] };
}

/**
 * Whether a doctor's own price stays within the clinic's published band for
 * that service — the clinic sets the floor and ceiling (usually as a range,
 * "EGP 300-600"), and each doctor's actual price has to land somewhere
 * inside it, not undercut the floor or exceed the ceiling.
 *
 * Fails open on purpose: a blank doctor price (no override at all), or
 * either side not reducing to number(s) worth comparing, means there is
 * nothing reliable to check — never block a save over a comparison that
 * cannot honestly be made.
 */
export function isPriceWithinClinicRange(
  doctorPriceLabel: string | null,
  clinicPriceLabel: string | null,
): boolean {
  const doctorAmount = extractSingleAmount(doctorPriceLabel);
  if (!doctorAmount) return true;
  const clinicRange = extractPriceRange(clinicPriceLabel);
  if (!clinicRange) return true;
  const value = Number(doctorAmount);
  return value >= clinicRange.min && value <= clinicRange.max;
}
